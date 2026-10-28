import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadConfig, childEnvironment } from './config.mjs';
import { runProcess, RuntimeError } from './process.mjs';
import { providerFailure } from './diagnostics.mjs';

function parseCodex(output) {
  const lines = output.trim().split('\n').filter(Boolean);
  let text = '', sessionId;
  let completed = false;
  for (const line of lines) {
    const event = JSON.parse(line);
    if (event.type === 'thread.started') sessionId = event.thread_id;
    if (event.type === 'turn.failed' || event.type === 'error')
      throw new RuntimeError('PROVIDER_ERROR', 'Codex no completó la consulta. Revisa sesión, cuota o conexión.');
    if (event.type === 'turn.completed') completed = true;
    if (event.type === 'item.completed' && event.item?.type === 'agent_message')
      text = event.item.text;
  }
  if (!completed || typeof text !== 'string' || !text.trim()) throw new Error('incomplete');
  return { text, sessionId };
}

function parseClaude(output) {
  const result = JSON.parse(output);
  if (result.is_error || result.subtype !== 'success')
    throw providerFailure('claude', { stdout: output });
  if (typeof result.result !== 'string' || !result.result.trim()) throw new Error('empty');
  return { text: result.result, sessionId: result.session_id };
}

export function createRuntime({ config, run = runProcess, env = process.env } = {}) {
  if (!config) throw new RuntimeError('CONFIG_ERROR', 'Falta configuración del runtime.');
  return {
    async ask({ provider, prompt, signal }) {
      if (!['codex', 'claude'].includes(provider))
        throw new RuntimeError('INVALID_PROVIDER', 'Proveedor no admitido.');
      if (typeof prompt !== 'string' || !prompt.trim() || Buffer.byteLength(prompt) > 256 * 1024)
        throw new RuntimeError('INVALID_PROMPT', 'El prompt debe contener entre 1 y 262144 bytes.');
      if (provider === 'claude' && !config.claudeToken)
        throw new RuntimeError('MISSING_TOKEN', 'Configura CLAUDE_CODE_OAUTH_TOKEN en .env.');
      const started = performance.now();
      // Separate trusted empty directory: no course/project hooks or instructions loaded by accident.
      const cwd = await mkdtemp(join(tmpdir(), 'understandly-runtime-'));
      try {
        const executable = provider === 'codex' ? config.codexBin : config.claudeBin;
        const args = provider === 'codex'
          ? ['exec', '--json', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check', '-']
          : ['-p', '--output-format', 'json', '--safe-mode', '--tools', '',
            '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
            '--no-session-persistence', '--permission-prompts', 'none'];
        const result = await run({ executable, args, input: prompt,
          env: childEnvironment(provider, config, env), cwd, signal, timeoutMs: config.timeoutMs });
        if (result.exitCode !== 0)
          throw providerFailure(provider, result);
        let parsed;
        try { parsed = provider === 'codex' ? parseCodex(result.stdout) : parseClaude(result.stdout); }
        catch (error) {
          if (error instanceof RuntimeError) throw error;
          throw new RuntimeError('INVALID_RESPONSE', 'El CLI devolvió una respuesta incompleta o incompatible.');
        }
        // Defense against accidental credential echoes from a provider.
        if (config.claudeToken) parsed.text = parsed.text.split(config.claudeToken).join('[REDACTED]');
        return { provider, ...parsed, durationMs: Math.round(performance.now() - started) };
      } finally { await rm(cwd, { recursive: true, force: true }); }
    }
  };
}

export { loadConfig, RuntimeError };
