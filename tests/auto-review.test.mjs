import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { autoReviewChapter } from '../src/review/auto.mjs';
import { CRITERIA } from '../src/review/contract.mjs';
import { formatProgress } from '../src/review/report.mjs';

const original = '---\nrevision: 1\n---\n\n# Demo {#demo}\nVague explanation. [1]\n\n## Sources\n1. https://example.org/source\n';
const parseData = request => {
  const marker = 'DATOS (JSON):';
  return JSON.parse(request.prompt.slice(request.prompt.indexOf(marker) + marker.length, request.prompt.lastIndexOf('FIN DE DATOS.')).trim());
};
const isCorrection = request => Object.hasOwn(request.responseSchema.properties, 'status');
function verdict(request, { approved = false, insufficient = false } = {}) {
  return {
    contentSha256: request.prompt.match(/Huella del capítulo: ([a-f0-9]{64})/)[1],
    evidenceSha256: request.prompt.match(/Huella de evidencias: ([a-f0-9]{64})/)[1],
    verdict: approved ? 'approved' : 'changes_required', summary: approved ? 'Clear and supported.' : 'Explain more clearly.',
    criteria: CRITERIA.map(id => ({ id, status: approved ? 'pass' : 'changes_required', reason: 'Test reason.' })),
    sourceChecks: [{ sourceId: '1', status: insufficient ? 'insufficient' : 'supported', reason: 'Test source.' }],
    issues: approved ? [] : [{ severity: 'blocking', section: 'demo', problem: 'Explanation is vague.', proposedChange: 'Make it precise.' }]
  };
}
function correction(request) {
  const { chapter } = parseData(request);
  return { status: 'revised', chapter: chapter.replace('Vague explanation.', 'Precise explanation.'),
    explanation: 'The explanation now identifies the concrete concept.',
    changes: [{ section: 'demo', before: 'Vague explanation.', after: 'Precise explanation.',
      reason: 'Both reviewers requested a concrete explanation.', addresses: ['codex:1', 'claude:1'] }] };
}
async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'understandly-auto-test-'));
  try {
    const options = { chapterPath: join(dir, 'chapter.md'), scopePath: join(dir, 'scope.md'),
      evidencePath: join(dir, 'sources.json'), outputDir: join(dir, 'auto') };
    await writeFile(options.chapterPath, original);
    await writeFile(options.scopePath, 'Fictional scope');
    await writeFile(options.evidencePath, JSON.stringify({ sources: [{ id: '1', url: 'https://example.org/source', excerpt: 'Fictional evidence.' }] }));
    await fn(options);
  } finally { await rm(dir, { recursive: true, force: true }); }
}

test('automatic review corrects once, re-reviews independently and records clear before/after explanations', async () => {
  await fixture(async options => {
    let writes = 0, reviews = 0;
    const runtime = { ask: async request => {
      if (isCorrection(request)) { writes++; return { text: JSON.stringify(correction(request)) }; }
      reviews++;
      return { text: JSON.stringify(verdict(request, { approved: parseData(request).chapter.includes('Precise explanation.') })) };
    } };
    const result = await autoReviewChapter({ ...options, runtime });
    assert.equal(result.cycle.approved, true);
    assert.equal(result.cycle.rounds.length, 2);
    assert.equal(writes, 1); assert.equal(reviews, 4);
    assert.match(await readFile(options.chapterPath, 'utf8'), /revision: 2/);
    assert.equal(await readFile(join(result.cycleDir, 'round-1-before.md'), 'utf8'), original);
    const report = await readFile(join(result.cycleDir, 'report.md'), 'utf8');
    for (const text of ['Antes', 'Después', 'Por qué', 'codex:1', 'Vague explanation.', 'Precise explanation.'])
      assert.ok(report.includes(text));
    assert.ok(result.cycle.contentSha256);
  });
});

test('max rounds stops without forcing approval or doing an unreviewed final rewrite', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      assert.equal(isCorrection(request), false);
      return { text: JSON.stringify(verdict(request)) };
    } };
    const { cycle } = await autoReviewChapter({ ...options, runtime, maxRounds: 1 });
    assert.equal(cycle.status, 'max_rounds');
    assert.equal(cycle.approved, false);
    assert.equal(await readFile(options.chapterPath, 'utf8'), original);
  });
});

test('missing evidence stops without a fabricated source or an author invocation', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      assert.equal(isCorrection(request), false);
      return { text: JSON.stringify(verdict(request, { insufficient: true })) };
    } };
    const { cycle } = await autoReviewChapter({ ...options, runtime });
    assert.equal(cycle.status, 'needs_evidence');
    assert.equal(cycle.approved, false);
  });
});

test('metadata-only rewrites cannot fake progress', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      if (!isCorrection(request)) return { text: JSON.stringify(verdict(request)) };
      const change = correction(request);
      change.chapter = original.replace('revision: 1', 'revision: 2');
      change.changes[0].before = 'revision: 1'; change.changes[0].after = 'revision: 2';
      return { text: JSON.stringify(change) };
    } };
    const { cycle } = await autoReviewChapter({ ...options, runtime });
    assert.equal(cycle.status, 'no_progress');
    assert.equal(await readFile(options.chapterPath, 'utf8'), original);
  });
});

test('invalid corrections do not change the file and do not expose arbitrary exceptions', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      if (!isCorrection(request)) return { text: JSON.stringify(verdict(request)) };
      throw new Error('secret-from-child');
    } };
    const { cycle } = await autoReviewChapter({ ...options, runtime });
    assert.equal(cycle.status, 'correction_failed');
    assert.ok(!JSON.stringify(cycle).includes('secret-from-child'));
    assert.equal(await readFile(options.chapterPath, 'utf8'), original);
  });
});

test('external changes during correction are retained, not overwritten', async () => {
  await fixture(async options => {
    const runtime = { ask: async request => {
      if (!isCorrection(request)) return { text: JSON.stringify(verdict(request)) };
      await writeFile(options.chapterPath, 'External edit');
      return { text: JSON.stringify(correction(request)) };
    } };
    const { cycle } = await autoReviewChapter({ ...options, runtime });
    assert.equal(cycle.status, 'correction_failed');
    assert.match(cycle.reason, /STALE_CORRECTION/);
    assert.equal(await readFile(options.chapterPath, 'utf8'), 'External edit');
  });
});

test('provider failures stop immediately; no retry loop or author is launched', async () => {
  await fixture(async options => {
    let calls = 0;
    const runtime = { ask: async () => { calls++; throw Object.assign(new Error('private'), { code: 'AUTH_FAILED' }); } };
    const { cycle } = await autoReviewChapter({ ...options, runtime });
    assert.equal(calls, 2);
    assert.equal(cycle.status, 'pending');
    assert.equal(cycle.rounds.length, 1);
  });
});

test('cancelled correction does not apply content and releases the lock', async () => {
  await fixture(async options => {
    const controller = new AbortController();
    const runtime = { ask: async request => {
      if (!isCorrection(request)) return { text: JSON.stringify(verdict(request)) };
      controller.abort(); return { text: JSON.stringify(correction(request)) };
    } };
    const { cycle } = await autoReviewChapter({ ...options, runtime, signal: controller.signal });
    assert.equal(cycle.status, 'cancelled');
    assert.equal(await readFile(options.chapterPath, 'utf8'), original);
    const second = await autoReviewChapter({ ...options, runtime: {
      ask: async request => ({ text: JSON.stringify(verdict(request, { approved: true })) })
    } });
    assert.equal(second.cycle.approved, true);
  });
});

test('unbounded rounds are rejected before any model calls', async () => {
  await assert.rejects(autoReviewChapter({ maxRounds: Infinity }), { code: 'INVALID_ROUNDS' });
});

test('human progress explains reviewer requests and applied changes without terminal escapes', () => {
  const output = formatProgress({ round: 1, provider: 'codex', status: 'completed', verdict: 'changes_required',
    summary: 'Falta una comparación.', issues: [{ severity: 'blocking', section: 'Ejemplo',
      problem: 'La comparación es ambigua.\u001b[31m', proposedChange: 'Distinguir ambas operaciones.' }] });
  assert.match(output, /pide cambios/);
  assert.match(output, /Obligatorio/);
  assert.match(output, /Distinguir ambas operaciones/);
  assert.ok(!output.includes('\u001b'));
});
