import { createRuntime, loadConfig } from '../src/runtime/index.mjs';
import { childEnvironment } from '../src/runtime/config.mjs';
import { runProcess } from '../src/runtime/process.mjs';
import { claudeTokenFormat } from '../src/runtime/diagnostics.mjs';

const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
const input = async () => {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 256 * 1024) throw Object.assign(new Error('Prompt demasiado grande.'), { code: 'INVALID_PROMPT' });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

try {
  const config = await loadConfig();
  const runtime = createRuntime({ config });
  const command = process.argv[2];
  if (command === 'check') {
    for (const provider of ['codex', 'claude']) {
      try {
        const result = await runProcess({ executable: config[`${provider}Bin`], args: ['--version'],
          env: childEnvironment(provider, config), timeoutMs: 10000, signal: controller.signal });
        if (result.exitCode !== 0) throw new Error();
        console.log(JSON.stringify({ provider, installed: true,
          version: result.stdout.trim().match(/\d+\.\d+\.\d+/)?.[0] ?? 'unknown',
          ...(provider === 'claude' ? { tokenFormat: claudeTokenFormat(config.claudeToken) } : {}),
          auth: provider === 'claude' ? (config.claudeToken ? 'token_configured_not_validated' : 'missing_token') : 'default_session_not_validated' }));
      } catch { process.exitCode = 1; console.log(JSON.stringify({ provider, installed: false })); }
    }
  } else if (command === 'smoke') {
    const selected = process.argv[3];
    if (selected && !['codex', 'claude'].includes(selected))
      throw Object.assign(new Error('Selecciona codex o claude.'), { code: 'INVALID_PROVIDER' });
    for (const provider of selected ? [selected] : ['codex', 'claude']) {
      try {
        const result = await runtime.ask({ provider, prompt: 'Responde únicamente UNDERSTANDLY_OK. No uses herramientas.', signal: controller.signal });
        const ok = result.text.trim() === 'UNDERSTANDLY_OK';
        console.log(JSON.stringify({ provider, ok, durationMs: result.durationMs }));
        if (!ok) process.exitCode = 1;
      } catch (error) {
        process.exitCode = 1;
        console.log(JSON.stringify({ provider, ok: false, code: error.code ?? 'RUNTIME_ERROR',
          ...(provider === 'claude' ? { tokenFormat: claudeTokenFormat(config.claudeToken) } : {}),
          message: error.code ? error.message : 'Error interno del runtime.' }));
      }
    }
  } else if (command === 'ask') {
    const result = await runtime.ask({ provider: process.argv[3], prompt: await input(), signal: controller.signal });
    console.log(result.text);
  } else {
    throw Object.assign(new Error('Usa check, smoke o ask <codex|claude> con el prompt por stdin.'), { code: 'USAGE' });
  }
} catch (error) {
  process.exitCode = 1;
  console.error(JSON.stringify({ code: error.code ?? 'RUNTIME_ERROR', message: error.code ? error.message : 'Error interno del runtime.' }));
}
