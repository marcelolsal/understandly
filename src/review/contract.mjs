import { RuntimeError } from '../runtime/process.mjs';

export const CRITERIA = ['accuracy_sources', 'scope', 'sequence', 'explanations_visuals',
  'practice_feedback', 'assessment', 'manuscript_accessibility'];
const string = { type: 'string' };
const object = (properties) => ({ type: 'object', properties,
  required: Object.keys(properties), additionalProperties: false });
export const REVIEW_SCHEMA = object({
  contentSha256: string,
  evidenceSha256: string,
  verdict: { type: 'string', enum: ['approved', 'changes_required'] },
  summary: string,
  criteria: { type: 'array', items: object({
    id: { type: 'string', enum: CRITERIA },
    status: { type: 'string', enum: ['pass', 'changes_required', 'unverified'] },
    reason: string
  }) },
  sourceChecks: { type: 'array', items: object({
    sourceId: string,
    status: { type: 'string', enum: ['supported', 'contradicted', 'insufficient'] },
    reason: string
  }) },
  issues: { type: 'array', items: object({
    severity: { type: 'string', enum: ['blocking', 'suggestion'] },
    section: string, problem: string, proposedChange: string
  }) }
});

export function validateReview(value, { contentSha256, evidenceSha256, sourceIds }) {
  const invalid = () => { throw new RuntimeError('INVALID_REVIEW', 'Dictamen incompleto, incoherente o de otra versión.'); };
  const exact = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.keys(obj).length === keys.length && keys.every(key => Object.hasOwn(obj, key));
  const text = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 12000;
  if (!exact(value, Object.keys(REVIEW_SCHEMA.properties)) || value.contentSha256 !== contentSha256 ||
      value.evidenceSha256 !== evidenceSha256 || !['approved', 'changes_required'].includes(value.verdict) ||
      !text(value.summary) || !Array.isArray(value.criteria) || !Array.isArray(value.sourceChecks) ||
      !Array.isArray(value.issues) || value.issues.length > 100) invalid();
  if (value.criteria.length !== CRITERIA.length || new Set(value.criteria.map(c => c?.id)).size !== CRITERIA.length) invalid();
  for (const criterion of value.criteria) {
    if (!exact(criterion, ['id', 'status', 'reason']) || !CRITERIA.includes(criterion.id) ||
      !['pass', 'changes_required', 'unverified'].includes(criterion.status) || !text(criterion.reason)) invalid();
  }
  if (!sourceIds.length || value.sourceChecks.length !== sourceIds.length ||
      new Set(value.sourceChecks.map(c => c?.sourceId)).size !== sourceIds.length) invalid();
  for (const source of value.sourceChecks) {
    if (!exact(source, ['sourceId', 'status', 'reason']) || !sourceIds.includes(source.sourceId) ||
      !['supported', 'contradicted', 'insufficient'].includes(source.status) || !text(source.reason)) invalid();
  }
  for (const issue of value.issues) {
    if (!exact(issue, ['severity', 'section', 'problem', 'proposedChange']) ||
      !['blocking', 'suggestion'].includes(issue.severity) ||
      ![issue.section, issue.problem, issue.proposedChange].every(text)) invalid();
  }
  if (value.verdict === 'approved' && (value.criteria.some(c => c.status !== 'pass') ||
      value.sourceChecks.some(c => c.status !== 'supported') || value.issues.some(i => i.severity === 'blocking'))) invalid();
  return value;
}

export function decide(records, { stale = false } = {}) {
  if (stale) return { status: 'stale', approved: false };
  if (['codex', 'claude'].some(p => records[p]?.status !== 'completed')) return { status: 'pending', approved: false };
  if (['codex', 'claude'].every(p => records[p].review.verdict === 'approved')) return { status: 'approved', approved: true };
  return { status: 'changes_required', approved: false };
}
