import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseChapter } from '../src/server/chapter.mjs';
import { initialState, applyAction, updateState, readState } from '../src/server/store.mjs';
import { tutorPrompt, askTutor } from '../src/server/tutor.mjs';
import { readJson } from '../src/server/http.mjs';

const source = '---\ntitle: Fictional chapter\nrevision: 1\n---\n\n## Concept {#concept}\nA useful concept.\n<script>alert(1)</script>\n[bad](javascript:alert)\n\n```mermaid\nflowchart TD\nA --> B\n```\n<details><summary>Feedback</summary>\nSecret solution.\n</details>\n';
const chapter = parseChapter(source);
const action = { type: 'attempt', version: chapter.version, section: 'concept', exercise: 'concept-1', answer: 'My reasoning.' };

test('chapter renderer preserves stable sections and gates feedback; strips executable HTML', () => {
  assert.equal(chapter.sections[0].id, 'concept');
  assert.deepEqual(chapter.sections[0].parts.map(p => p.type), ['html', 'diagram', 'html', 'exercise']);
  assert.ok(!chapter.sections[0].parts[0].html.includes('<script>'));
  assert.ok(!chapter.sections[0].parts[0].html.includes('javascript:'));
  assert.ok(!chapter.sections[0].parts[0].html.includes('Secret solution'));
  assert.match(chapter.sections[0].parts.at(-1).html, /Secret solution/);
});

test('state rejects stale versions and unknown exercises, preserves old notes and never certifies mastery', () => {
  const state = initialState();
  state.notes.push({ version: 'older', answer: 'Old note' });
  assert.throws(() => applyAction(state, { ...action, version: 'older' }, chapter), { status: 409 });
  assert.throws(() => applyAction(state, { ...action, exercise: 'unknown' }, chapter), { status: 400 });
  applyAction(state, action, chapter);
  assert.equal(state.attempts.length, 1);
  assert.equal(state.notes[0].answer, 'Old note');
  assert.equal(state.mastery, undefined);
});

test('concurrent note and attempt writes preserve both and survive reload', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'understandly-state-'));
  const path = join(directory, 'study.json');
  try {
    await Promise.all([
      updateState(action, chapter, path),
      updateState({ type: 'note', version: chapter.version, section: 'concept', selection: 'Concept', question: 'Why?', answer: 'A reason.' }, chapter, path),
      updateState({ type: 'position', version: chapter.version, section: 'concept' }, chapter, path)
    ]);
    const state = await readState(path);
    assert.equal(state.notes.length, 1);
    assert.equal(state.attempts.length, 1);
    assert.equal(state.position.section, 'concept');
    assert.equal(JSON.parse(await readFile(path, 'utf8')).schema, 1);
    await writeFile(path, 'broken');
    await assert.rejects(readState(path)); // Never silently overwrite corrupt user data.
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('contextual tutor sends only selected section, omits solution blocks, and uses specified CLI', async () => {
  const input = { provider: 'claude', mode: 'explain', version: chapter.version, section: 'concept', selection: 'A useful concept.', question: 'Why?' };
  const prompt = tutorPrompt(input, chapter);
  assert.ok(!prompt.includes('Secret solution.'));
  let called = false;
  const result = await askTutor(input, chapter, undefined, { ask: async request => {
    called = true;
    assert.equal(request.provider, 'claude');
    assert.equal(request.prompt, prompt);
    return { text: 'Fictional answer for test.' };
  } });
  assert.equal(called, true);
  assert.equal(result.answer, 'Fictional answer for test.');
  assert.throws(() => tutorPrompt({ ...input, provider: 'shell' }, chapter), { status: 400 });
});

test('position records visited sections once per version, including in older state files', () => {
  const state = { schema: 1, notes: [], attempts: [], position: null };
  const position = { type: 'position', version: chapter.version, section: 'concept' };
  applyAction(state, position, chapter);
  applyAction(state, position, chapter);
  assert.deepEqual(state.visited, [{ section: 'concept', version: chapter.version }]);
});

test('tutor summary needs a conversation and is limited to what was discussed', () => {
  const input = { provider: 'claude', mode: 'summary', version: chapter.version, section: 'concept', selection: 'A useful concept.' };
  assert.throws(() => tutorPrompt(input, chapter), { status: 400 });
  const prompt = tutorPrompt({ ...input, history: [{ question: 'Why?', answer: 'Because.' }] }, chapter);
  assert.match(prompt, /No añadas ideas nuevas/);
  assert.ok(!prompt.includes('Secret solution.'));
});

test('JSON endpoints reject foreign origins, oversized bodies and malformed data', async () => {
  const request = (body, origin = 'http://localhost:4321') => new Request('http://localhost:4321/api/study', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body
  });
  await assert.rejects(readJson(request('{}', 'https://other.example')), { status: 403 });
  await assert.rejects(readJson(request('x'.repeat(50)), 20), { status: 413 });
  await assert.rejects(readJson(request('broken')), { status: 400 });
  assert.deepEqual(await readJson(request('{"ok":true}')), { ok: true });
});
