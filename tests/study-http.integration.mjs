import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { parseChapter } from '../src/server/chapter.mjs';

const manuscript = '---\ntitle: Fictional integration course\nrevision: 1\n---\n\n## Concept {#concept}\nA fictional explanation.\n\n<details><summary>Feedback</summary>\nA fictional solution.\n</details>\n';

test('built server serves private course, stores attempts/notes and calls CLI adapter with CSRF protection', async () => {
  const root = await mkdtemp(join(tmpdir(), 'understandly-http-'));
  const directory = join(root, 'courses/docker/chapters');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, '01-modelo-mental.md'), manuscript);
  const binary = join(root, 'fixture-cli.cjs');
  await writeFile(binary, `#!${process.execPath}\nprocess.stdin.resume(); process.stdin.on('end', () => {\nconsole.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'Fictional CLI reply for integration test.'}}));\nconsole.log(JSON.stringify({type:'turn.completed'}));\n});\n`);
  await chmod(binary, 0o700);
  const child = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, UNDERSTANDLY_DATA_DIR: root, UNDERSTANDLY_CODEX_BIN: binary, HOST: '127.0.0.1', PORT: '14327' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk.toString(); });
  child.stderr.on('data', chunk => { logs += chunk.toString(); });
  const origin = 'http://127.0.0.1:14327';
  const post = (path, data, otherOrigin = origin) => fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: otherOrigin }, body: JSON.stringify(data) });
  try {
    for (let i = 0; i < 60 && !logs.includes('Server listening'); i++) {
      if (child.exitCode !== null) throw new Error('Test server could not start.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes('Fictional integration course'));
    assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.ok(!html.includes('CLAUDE_CODE_OAUTH_TOKEN'));
    const version = parseChapter(manuscript).version;
    const attempt = await post('/api/study', { type: 'attempt', version, section: 'concept', exercise: 'concept-1', answer: 'A fictional attempt.', assisted: false });
    assert.equal(attempt.status, 200);
    assert.equal((await attempt.json()).attempts.length, 1);
    const tutor = await post('/api/tutor', { version, section: 'concept', selection: 'A fictional explanation.', question: 'Why?', provider: 'codex', mode: 'explain' });
    assert.equal(tutor.status, 200);
    const answer = (await tutor.json()).answer;
    assert.equal(answer, 'Fictional CLI reply for integration test.');
    const note = await post('/api/study', { type: 'note', version, section: 'concept', selection: 'A fictional explanation.', question: 'Why?', answer });
    assert.equal(note.status, 200);
    const saved = await (await fetch(origin + '/api/study')).json();
    assert.equal(saved.notes.length, 1);
    assert.equal(saved.attempts.length, 1);
    const denied = await post('/api/study', { type: 'position', version, section: 'concept' }, 'https://foreign.example');
    assert.equal(denied.status, 403);
    const stale = await post('/api/study', { type: 'position', version: 'older', section: 'concept' });
    assert.equal(stale.status, 409);
    const privateFile = await fetch(origin + '/.env');
    assert.equal(privateFile.status, 404);
  } finally {
    child.kill('SIGTERM');
    if (child.exitCode === null) await once(child, 'exit');
    await rm(root, { recursive: true, force: true });
  }
});


test('shared preview supports forwarded hosts but never returns personal state or executes APIs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'understandly-share-'));
  await mkdir(join(root, 'courses/docker/chapters'), { recursive: true });
  await mkdir(join(root, 'study'), { recursive: true });
  await writeFile(join(root, 'courses/docker/chapters/01-modelo-mental.md'), manuscript);
  await writeFile(join(root, 'study/docker-capitulo-01.json'), JSON.stringify({ schema: 1,
    notes: [{ id: 'private', answer: 'PRIVATE-NOTE-SENTINEL', question: 'PRIVATE-QUESTION-SENTINEL' }],
    attempts: [{ answer: 'PRIVATE-ATTEMPT-SENTINEL' }], position: null }));
  const child = spawn(process.execPath, ['scripts/share.mjs'], { env: { ...process.env, UNDERSTANDLY_DATA_DIR: root,
    HOST: '127.0.0.1', PORT: '14328' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk.toString(); });
  child.stderr.on('data', chunk => { logs += chunk.toString(); });
  const origin = 'http://127.0.0.1:14328';
  try {
    for (let i = 0; i < 60 && !logs.includes('Server listening'); i++) {
      if (child.exitCode !== null) throw new Error('Shared test server could not start.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const page = await fetch(origin, { headers: { Host: 'preview.example', 'X-Forwarded-Host': 'preview.example', 'X-Forwarded-Proto': 'https' } });
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes('Vista compartida'));
    assert.ok(html.includes('Fictional integration course'));
    assert.ok(!html.includes('PRIVATE-NOTE-SENTINEL'));
    assert.ok(!html.includes('PRIVATE-QUESTION-SENTINEL'));
    assert.ok(!html.includes('PRIVATE-ATTEMPT-SENTINEL'));
    assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
    for (const endpoint of ['/api/study', '/api/tutor']) {
      assert.equal((await fetch(origin + endpoint)).status, 403);
      assert.equal((await fetch(origin + endpoint, { method: 'POST', headers: { Origin: origin,
        'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    }
    assert.equal((await fetch(origin + '/.env')).status, 403);
    assert.equal((await fetch(origin + '/%61pi/study')).status, 403);
    const local = await fetch(origin); // Local Host cannot bypass sharing restrictions.
    assert.ok(!(await local.text()).includes('PRIVATE-NOTE-SENTINEL'));
  } finally {
    child.kill('SIGTERM');
    if (child.exitCode === null) await once(child, 'exit');
    await rm(root, { recursive: true, force: true });
  }
});
