import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRuntime, loadConfig } from '../src/runtime/index.mjs';
import { childEnvironment } from '../src/runtime/config.mjs';
import { runProcess } from '../src/runtime/process.mjs';
import { claudeTokenFormat, providerFailure } from '../src/runtime/diagnostics.mjs';

const config = { codexBin: 'codex', claudeBin: 'claude', claudeToken: 'test-secret-only', timeoutMs: 1000 };
const codexSuccess = [
  { type: 'thread.started', thread_id: 'isolated-thread' },
  { type: 'item.completed', item: { type: 'agent_message', text: 'Respuesta' } },
  { type: 'turn.completed' }
].map(JSON.stringify).join('\n');

test('loads .env as data, does not evaluate shell syntax or mutate the environment', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'understandly-config-test-'));
  try {
    const envFile = join(dir, '.env');
    await writeFile(envFile, 'CLAUDE_CODE_OAUTH_TOKEN="$(touch should-not-exist)"\nUNDERSTANDLY_RUNTIME_TIMEOUT_MS=1500\n');
    const env = { PATH: process.env.PATH };
    const loaded = await loadConfig({ envFile, env });
    assert.equal(loaded.claudeToken, '$(touch should-not-exist)');
    assert.equal(loaded.timeoutMs, 1500);
    assert.equal(env.CLAUDE_CODE_OAUTH_TOKEN, undefined);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('rejects invalid timeout without printing configuration', async () => {
  await assert.rejects(loadConfig({ envFile: '/nonexistent-understandly-env', env: {
    UNDERSTANDLY_RUNTIME_TIMEOUT_MS: 'secret-invalid' } }),
  (error) => error.code === 'CONFIG_ERROR' && !error.message.includes('secret-invalid'));
});

test('separates provider credentials and retains the default Codex home', () => {
  const base = { PATH: '/bin', CODEX_HOME: '/existing-default', OPENAI_API_KEY: 'paid',
    CODEX_API_KEY: 'paid', CODEX_ACCESS_TOKEN: 'other-account',
    ANTHROPIC_API_KEY: 'paid', ANTHROPIC_AUTH_TOKEN: 'paid', CLAUDE_CODE_OAUTH_TOKEN: 'inherited',
    CLAUDECODE: 'nested-session' };
  const codex = childEnvironment('codex', config, base);
  assert.deepEqual(codex, { PATH: '/bin', CODEX_HOME: '/existing-default' });
  const claude = childEnvironment('claude', config, base);
  assert.equal(claude.CLAUDE_CODE_OAUTH_TOKEN, config.claudeToken);
  assert.equal(claude.ANTHROPIC_API_KEY, undefined);
  assert.equal(base.ANTHROPIC_API_KEY, 'paid');
});

test('Codex receives prompt only through stdin, parses a completed turn and cleans workspace', async () => {
  let cwd;
  const prompt = 'Explain $(touch NEVER) and `commands` without running them';
  const runtime = createRuntime({ config, env: {}, run: async (request) => {
    cwd = request.cwd;
    assert.equal(request.input, prompt);
    assert.ok(!request.args.includes(prompt));
    assert.ok(request.args.includes('read-only'));
    assert.ok(!request.args.includes('--profile'));
    assert.equal(request.env.CLAUDE_CODE_OAUTH_TOKEN, undefined);
    await access(cwd);
    return { exitCode: 0, stdout: codexSuccess };
  } });
  const response = await runtime.ask({ provider: 'codex', prompt });
  assert.equal(response.text, 'Respuesta');
  assert.equal(response.sessionId, 'isolated-thread');
  await assert.rejects(access(cwd));
});

test('Claude uses subscription token, disables tools/customizations, never bare mode', async () => {
  const runtime = createRuntime({ config, env: {}, run: async (request) => {
    assert.equal(request.env.CLAUDE_CODE_OAUTH_TOKEN, config.claudeToken);
    assert.ok(request.args.includes('--safe-mode'));
    assert.ok(!request.args.includes('--bare'));
    assert.equal(request.args[request.args.indexOf('--tools') + 1], '');
    return { exitCode: 0, stdout: JSON.stringify({ type: 'result', subtype: 'success',
      is_error: false, result: `Answer ${config.claudeToken}`, session_id: 'claude-thread' }) };
  } });
  assert.equal((await runtime.ask({ provider: 'claude', prompt: 'Question' })).text, 'Answer [REDACTED]');
});

test('missing token fails before spawning and never falls back to another provider', async () => {
  let calls = 0;
  const runtime = createRuntime({ config: { ...config, claudeToken: undefined }, run: () => { calls++; } });
  await assert.rejects(runtime.ask({ provider: 'claude', prompt: 'Question' }), { code: 'MISSING_TOKEN' });
  assert.equal(calls, 0);
});

test('invalid providers and prompts fail before spawning', async () => {
  const runtime = createRuntime({ config, run: () => assert.fail('must not spawn') });
  await assert.rejects(runtime.ask({ provider: 'other', prompt: 'Question' }), { code: 'INVALID_PROVIDER' });
  await assert.rejects(runtime.ask({ provider: 'codex', prompt: ' ' }), { code: 'INVALID_PROMPT' });
});

test('rejects incomplete output, provider errors, nonzero exits, without raw output', async () => {
  const cases = [
    ['codex', 0, '{broken', 'INVALID_RESPONSE'],
    ['codex', 0, '{"type":"item.completed","item":{"type":"agent_message","text":"partial"}}', 'INVALID_RESPONSE'],
    ['codex', 0, '{"type":"turn.failed","error":{"message":"secret"}}', 'PROVIDER_ERROR'],
    ['claude', 0, '{"subtype":"error_during_execution","is_error":true,"result":"secret"}', 'CLI_FAILED'],
    ['claude', 1, 'secret', 'CLI_FAILED']
  ];
  for (const [provider, exitCode, stdout, code] of cases) {
    const runtime = createRuntime({ config, run: async () => ({ exitCode, stdout, stderr: 'secret' }) });
    await assert.rejects(runtime.ask({ provider, prompt: 'Question' }),
      (error) => error.code === code && !error.message.includes('secret') && !('stderr' in error));
  }
});

test('process runner transmits shell-looking stdin literally and decodes Unicode', async () => {
  const input = 'á漢🙂 $(touch NEVER)';
  const result = await runProcess({ executable: process.execPath,
    args: ['-e', 'process.stdin.pipe(process.stdout)'], input, env: process.env, timeoutMs: 2000 });
  assert.equal(result.stdout, input);
  assert.equal(result.exitCode, 0);
});

test('process runner bounds output', async () => {
  await assert.rejects(runProcess({ executable: process.execPath,
    args: ['-e', 'process.stdout.write("x".repeat(10000))'], maxBytes: 100, timeoutMs: 2000 }),
  { code: 'OUTPUT_LIMIT' });
});

test('process runner times out and accepts cancellation', async () => {
  await assert.rejects(runProcess({ executable: process.execPath,
    args: ['-e', 'setInterval(()=>{},1000)'], timeoutMs: 80 }), { code: 'TIMEOUT' });
  const controller = new AbortController();
  const running = runProcess({ executable: process.execPath,
    args: ['-e', 'setInterval(()=>{},1000)'], signal: controller.signal });
  controller.abort();
  await assert.rejects(running, { code: 'CANCELLED' });
});

test('missing executable reports an actionable error without raw paths', async () => {
  await assert.rejects(runProcess({ executable: '/nonexistent-private-cli', args: [] }),
    (error) => error.code === 'CLI_NOT_FOUND' && !error.message.includes('private-cli'));
});

test('diagnostics identify known errors without exposing credentials or source output', () => {
  const cases = [
    ['Invalid OAuth token sk-ant-oat-secret', 'AUTH_FAILED'],
    ['API Error: 401 authentication_error secret', 'AUTH_FAILED'],
    ['Hit your limit secret', 'USAGE_LIMIT'],
    ["error: unknown option '--private-flag' secret", 'INVALID_CLI_OPTIONS'],
    ['EACCES /private/secret', 'LOCAL_PERMISSION_ERROR'],
    ['Unable to connect to API secret', 'NETWORK_ERROR'],
    ['unclassified secret', 'CLI_FAILED']
  ];
  for (const [stderr, code] of cases) {
    const error = providerFailure('claude', { stderr });
    assert.equal(error.code, code);
    assert.ok(!error.message.includes('secret'));
    assert.ok(!error.message.includes('/private'));
  }
});

test('token format is a hint, not a validation, and never exposes the token', () => {
  assert.equal(claudeTokenFormat('sk-ant-oat-fake'), 'subscription_oauth');
  assert.equal(claudeTokenFormat('sk-ant-api-fake'), 'api_key_not_subscription');
  assert.equal(claudeTokenFormat('other-secret'), 'unrecognized');
  assert.equal(claudeTokenFormat(), 'missing');
});
