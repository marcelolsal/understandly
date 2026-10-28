import { resolve } from 'node:path';
import { createRuntime, loadConfig } from '../src/runtime/index.mjs';
import { reviewChapter } from '../src/review/index.mjs';

const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
try {
  const args = process.argv.slice(2);
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--chapter', '--scope', '--evidence', '--output'].includes(args[i]) || !args[i + 1] || values[args[i]])
      throw Object.assign(new Error(), { code: 'USAGE' });
    values[args[i]] = args[i + 1];
  }
  if (!values['--chapter'] || !values['--evidence']) throw Object.assign(new Error(), { code: 'USAGE' });
  const result = await reviewChapter({ runtime: createRuntime({ config: await loadConfig() }),
    chapterPath: values['--chapter'], evidencePath: values['--evidence'],
    scopePath: values['--scope'] ?? resolve('docs/pilots/docker.md'), outputDir: values['--output'],
    signal: controller.signal, onProgress: event => console.log(JSON.stringify(event)) });
  console.log(JSON.stringify({ status: result.manifest.status, approved: result.manifest.approved, runDir: result.runDir }));
  if (!result.manifest.approved) process.exitCode = 1;
} catch {
  // Do not print arbitrary exception messages containing private file paths or content.
  console.error('No se pudo preparar o guardar la revisión. Usa --chapter <archivo> --evidence <json> [--scope <archivo>] [--output <directorio>]. Datos privados fuera de Git.');
  process.exitCode = 1;
}
