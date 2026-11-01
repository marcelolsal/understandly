import { readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { readBounded, sha256 } from './index.mjs';
import { REVIEW_SCHEMA, validateReview } from './contract.mjs';

// Reuse only a completed approval backed by the original snapshot and valid dictamen.
// History remains immutable; changing inputs or roles requires a fresh review.
export async function findApproval({ output, chapterPath, scopePath, evidencePath, author, reviewer }) {
  const [chapter, scope, evidenceText] = await Promise.all([chapterPath, scopePath, evidencePath].map(readBounded));
  let evidence;
  try { evidence = JSON.parse(evidenceText); } catch { return null; }
  const hashes = { contentSha256: sha256(chapter), scopeSha256: sha256(scope), evidenceSha256: sha256(evidenceText) };
  const entries = await readdir(output, { withFileTypes: true });
  for (const entry of entries.filter(e => e.isDirectory()).sort((a, b) => b.name.localeCompare(a.name))) {
    try {
      const cycleDir = join(output, entry.name);
      const cycle = JSON.parse(await readBounded(join(cycleDir, 'cycle.json')));
      if (cycle.status !== 'approved' || cycle.approved !== true || cycle.policy !== 'author_reviewer' ||
          cycle.author !== author || cycle.reviewer !== reviewer ||
          Object.entries(hashes).some(([key, hash]) => cycle[key] !== hash)) continue;
      const last = cycle.rounds.at(-1);
      if (last.status !== 'approved') continue;
      const runDir = join(cycleDir, 'reviews', basename(last.runDir));
      const manifest = JSON.parse(await readBounded(join(runDir, 'manifest.json')));
      const snapshot = JSON.parse(await readBounded(join(runDir, 'snapshot.json')));
      if (manifest.status !== 'approved' || manifest.approved !== true || manifest.policy !== cycle.policy ||
          manifest.reviewers?.length !== 1 || manifest.reviewers[0] !== reviewer ||
          manifest.schemaSha256 !== sha256(JSON.stringify(REVIEW_SCHEMA)) ||
          Object.entries(hashes).some(([key, hash]) => manifest[key] !== hash) ||
          snapshot.chapter !== chapter || snapshot.scope !== scope || snapshot.evidenceText !== evidenceText) continue;
      const record = manifest.reviews[reviewer];
      if (record.status !== 'completed' || record.provider !== reviewer ||
          Object.entries(hashes).some(([key, hash]) => record[key] !== hash)) continue;
      validateReview(record.review, { ...hashes, sourceIds: evidence.sources.map(s => s.id) });
      if (record.review.verdict !== 'approved') continue;
      // Recheck after reading the history in case an editor changed an input meanwhile.
      const current = await Promise.all([chapterPath, scopePath, evidencePath].map(readBounded));
      if (current.some((text, i) => text !== [chapter, scope, evidenceText][i])) return null;
      return { cycleDir, cycle, reused: true };
    } catch {
      // Incomplete, obsolete or damaged history is not an approval.
    }
  }
  return null;
}
