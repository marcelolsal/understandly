import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRITERIA, validateReview } from '../src/review/contract.mjs';
import { reviewChapter } from '../src/review/index.mjs';
import { createRuntime } from '../src/runtime/index.mjs';
import { validateReferences } from '../src/review/references.mjs';

const evidence = { sources: [{ id: '1', url: 'https://example.org/source', excerpt: 'Fictional evidence for tests.' }] };
const chapterFixture = '# Fictional chapter\n\nA claim. [1]\n\n## Sources\n1. https://example.org/source\n';
function reviewFor(request) {
  const contentSha256 = request.prompt.match(/Huella del capítulo: ([a-f0-9]{64})/)[1];
  const evidenceSha256 = request.prompt.match(/Huella de evidencias: ([a-f0-9]{64})/)[1];
  return { contentSha256, evidenceSha256, verdict: 'approved', summary: 'Revisión ficticia de prueba.',
    criteria: CRITERIA.map(id => ({ id, status: 'pass', reason: 'Cumple en esta prueba.' })),
    sourceChecks: [{ sourceId: '1', status: 'supported', reason: 'Evidencia ficticia suficiente.' }], issues: [] };
}
async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'understandly-review-test-'));
  try {
    const chapterPath = join(dir, 'chapter.md'), scopePath = join(dir, 'scope.md'), evidencePath = join(dir, 'sources.json');
    await writeFile(chapterPath, chapterFixture);
    await writeFile(scopePath, 'Fictional scope');
    await writeFile(evidencePath, JSON.stringify(evidence));
    await fn({ chapterPath, scopePath, evidencePath, outputDir: join(dir, 'reviews') });
  } finally { await rm(dir, { recursive: true, force: true }); }
}

test('independent reviews receive identical input, preserve snapshots and require two approvals', async () => {
  await fixture(async options => {
    const calls = [];
    const runtime = { ask: async request => {
      calls.push(request);
      return { text: JSON.stringify(reviewFor(request)), durationMs: 1 };
    } };
    const result = await reviewChapter({ ...options, runtime });
    assert.equal(result.manifest.approved, true);
    assert.equal(result.manifest.status, 'approved');
    assert.deepEqual(calls.map(c => c.provider).sort(), ['claude', 'codex']);
    assert.equal(calls[0].prompt, calls[1].prompt);
    assert.deepEqual(calls[0].responseSchema, calls[1].responseSchema);
    assert.equal((JSON.parse(await readFile(join(result.runDir, 'snapshot.json')))).chapter, chapterFixture);
    assert.equal(await readFile(options.chapterPath, 'utf8'), chapterFixture);
  });
});

test('one failure never fabricates approval and does not lose the other review', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      if (request.provider === 'claude') throw Object.assign(new Error('private-secret'), { code: 'AUTH_FAILED' });
      return { text: JSON.stringify(reviewFor(request)) };
    } };
    const { manifest, runDir } = await reviewChapter({ ...options, runtime });
    assert.equal(manifest.status, 'pending');
    assert.equal(manifest.approved, false);
    assert.equal(manifest.reviews.codex.status, 'completed');
    assert.equal(manifest.reviews.claude.code, 'AUTH_FAILED');
    assert.ok(!(await readFile(join(runDir, 'manifest.json'), 'utf8')).includes('private-secret'));
  });
});

test('a request for changes blocks approval even when the other reviewer approves', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      const review = reviewFor(request);
      if (request.provider === 'claude') {
        review.verdict = 'changes_required';
        review.criteria[0].status = 'unverified';
      }
      return { text: JSON.stringify(review) };
    } };
    const { manifest } = await reviewChapter({ ...options, runtime });
    assert.equal(manifest.status, 'changes_required');
    assert.equal(manifest.approved, false);
  });
});

test('edits during a review invalidate approval and original evidence stays frozen', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      if (request.provider === 'claude') await writeFile(options.chapterPath, '# Changed\n');
      return { text: JSON.stringify(reviewFor(request)) };
    } };
    const { manifest } = await reviewChapter({ ...options, runtime });
    assert.equal(manifest.status, 'stale');
    assert.equal(manifest.approved, false);
  });
});

test('inconsistent approval, missing criteria, wrong hashes and incomplete sources are invalid', () => {
  const base = { contentSha256: 'a'.repeat(64), evidenceSha256: 'b'.repeat(64), verdict: 'approved', summary: 'Summary',
    criteria: CRITERIA.map(id => ({ id, status: 'pass', reason: 'Reason' })),
    sourceChecks: [{ sourceId: '1', status: 'supported', reason: 'Reason' }], issues: [] };
  const contract = { contentSha256: base.contentSha256, evidenceSha256: base.evidenceSha256, sourceIds: ['1'] };
  const changes = [
    r => r.criteria.pop(),
    r => r.criteria[0].status = 'unverified',
    r => r.contentSha256 = 'c'.repeat(64),
    r => r.sourceChecks[0].status = 'insufficient',
    r => r.issues.push({ severity: 'blocking', section: 's', problem: 'p', proposedChange: 'c' })
  ];
  for (const change of changes) {
    const review = structuredClone(base); change(review);
    assert.throws(() => validateReview(review, contract), { code: 'INVALID_REVIEW' });
  }
});

test('a second run preserves the first run and uses a different directory', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => ({ text: JSON.stringify(reviewFor(request)) }) };
    const first = await reviewChapter({ ...options, runtime });
    const second = await reviewChapter({ ...options, runtime });
    assert.notEqual(first.runDir, second.runDir);
    assert.equal(JSON.parse(await readFile(join(first.runDir, 'manifest.json'))).approved, true);
  });
});

test('rejects private artifacts within a Git repository before invoking models', async () => {
  await fixture(async options => {
    // Simulate a repository through a .git file (also covers Git worktrees).
    await writeFile(join(options.chapterPath, '..', '.git'), 'gitdir: fake');
    await assert.rejects(reviewChapter({ ...options, runtime: { ask: () => assert.fail('must not run') } }),
      { code: 'PRIVATE_DATA_IN_REPO' });
  });
});

test('runtime forwards schemas and accepts Claude structured_output without result text', async () => {
  const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false };
  const runtime = createRuntime({ config: { codexBin: 'codex', claudeBin: 'claude', claudeToken: 'fake', timeoutMs: 1000 },
    run: async request => {
      if (request.executable === 'codex') {
        const path = request.args[request.args.indexOf('--output-schema') + 1];
        assert.deepEqual(JSON.parse(await readFile(path)), schema);
        return { exitCode: 0, stdout: [
          { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } },
          { type: 'turn.completed' }
        ].map(JSON.stringify).join('\n') };
      }
      assert.deepEqual(JSON.parse(request.args[request.args.indexOf('--json-schema') + 1]), schema);
      return { exitCode: 0, stdout: JSON.stringify({ subtype: 'success', is_error: false, structured_output: { ok: true } }) };
    } });
  for (const provider of ['codex', 'claude']) {
    const result = await runtime.ask({ provider, prompt: 'Test', responseSchema: schema });
    assert.deepEqual(JSON.parse(result.text), { ok: true });
  }
});

test('reference checks reject mismatches, missing sources, unknown citations and duplicates', () => {
  assert.doesNotThrow(() => validateReferences(chapterFixture, evidence));
  assert.throws(() => validateReferences(chapterFixture.replace('example.org/source', 'example.org/wrong'), evidence),
    { code: 'SOURCE_REFERENCE_MISMATCH' });
  assert.throws(() => validateReferences('# No reference', evidence), { code: 'SOURCE_REFERENCE_MISMATCH' });
  assert.throws(() => validateReferences(chapterFixture + '\nClaim [9]', evidence), { code: 'UNKNOWN_CITATION' });
  assert.throws(() => validateReferences(chapterFixture + '\n1. https://example.org/source', evidence),
    { code: 'DUPLICATE_REFERENCE' });
});

test('a source mismatch consumes no model calls and creates no run artifacts', async () => {
  await fixture(async options => {
    await writeFile(options.chapterPath, chapterFixture.replace('example.org/source', 'example.org/wrong'));
    await assert.rejects(reviewChapter({ ...options, runtime: { ask: () => assert.fail('must not invoke provider') } }),
      { code: 'SOURCE_REFERENCE_MISMATCH' });
  });
});
