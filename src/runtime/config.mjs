import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { RuntimeError } from './process.mjs';

export async function loadConfig({ envFile = '.env', env = process.env } = {}) {
  let file = {};
  try { file = parseEnv(await readFile(envFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new RuntimeError('CONFIG_ERROR', 'No se pudo leer .env.');
  }
  // Application configuration only. Do not source shell code or mutate process.env.
  const value = (key) => env[key] ?? file[key];
  const timeoutMs = Number(value('UNDERSTANDLY_RUNTIME_TIMEOUT_MS') ?? 90000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000)
    throw new RuntimeError('CONFIG_ERROR', 'El timeout debe estar entre 1000 y 600000 ms.');
  let claudeBin = value('UNDERSTANDLY_CLAUDE_BIN');
  if (!claudeBin) {
    const local = join(homedir(), '.local', 'bin', 'claude');
    try { await access(local, constants.X_OK); claudeBin = local; }
    catch { claudeBin = 'claude'; }
  }
  return { codexBin: value('UNDERSTANDLY_CODEX_BIN') || 'codex', claudeBin,
    claudeToken: value('CLAUDE_CODE_OAUTH_TOKEN')?.trim(), timeoutMs };
}

export function childEnvironment(provider, config, base = process.env) {
  const env = { ...base };
  // Retain default Codex config/session (including existing CODEX_HOME), but never
  // introduce account selection or pass API billing / the other provider's credentials.
  for (const key of Object.keys(env)) {
    if (/^(ANTHROPIC_|CLAUDE_|CLAUDECODE$|OPENAI_|CODEX_(API_KEY|ACCESS_TOKEN)$)/.test(key))
      delete env[key];
  }
  if (provider === 'claude' && config.claudeToken) env.CLAUDE_CODE_OAUTH_TOKEN = config.claudeToken;
  return env;
}
