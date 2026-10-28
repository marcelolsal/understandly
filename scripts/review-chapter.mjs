import { resolve } from 'node:path';
import { createRuntime, loadConfig } from '../src/runtime/index.mjs';
import { reviewChapter } from '../src/review/index.mjs';
import { autoReviewChapter } from '../src/review/auto.mjs';
import { formatProgress } from '../src/review/report.mjs';

const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
try {
  const args = process.argv.slice(2);
  const values = {};
  let automatic = false;
  let human = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--auto' && !automatic) { automatic = true; continue; }
    if (args[i] === '--human' && !human) { human = true; continue; }
    if (!['--chapter', '--scope', '--evidence', '--output', '--max-rounds', '--author', '--reviewer'].includes(args[i]) || !args[i + 1] || values[args[i]])
      throw Object.assign(new Error(), { code: 'USAGE' });
    const key = args[i];
    values[key] = args[++i];
  }
  if (!values['--chapter'] || !values['--evidence'] || (!automatic && values['--max-rounds']))
    throw Object.assign(new Error(), { code: 'USAGE' });
  const author = values['--author'] ?? 'codex';
  const reviewer = values['--reviewer'] ?? (author === 'codex' ? 'claude' : 'codex');
  if (!['codex', 'claude'].includes(author) || !['codex', 'claude'].includes(reviewer) || author === reviewer)
    throw Object.assign(new Error('Autor y revisor deben ser distintos: codex o claude.'), { code: 'INVALID_ROLES' });
  const options = { runtime: createRuntime({ config: await loadConfig() }),
    chapterPath: values['--chapter'], evidencePath: values['--evidence'],
    scopePath: values['--scope'] ?? resolve('docs/pilots/docker.md'), outputDir: values['--output'],
    author, reviewer, reviewers: [reviewer], signal: controller.signal, onProgress: event => console.log(human ? formatProgress(event) : JSON.stringify(event)) };
  const result = automatic ? await autoReviewChapter({ ...options, maxRounds: Number(values['--max-rounds'] ?? 3) })
    : await reviewChapter(options);
  const status = result.cycle ?? result.manifest;
  console.log(JSON.stringify({ status: status.status, approved: status.approved,
    ...(status.reason ? { reason: status.reason } : {}), runDir: result.cycleDir ?? result.runDir,
    report: `${result.cycleDir ?? result.runDir}/report.md` }));
  if (!status.approved) process.exitCode = 1;
} catch (error) {
  // Do not print arbitrary exception messages containing private file paths or content.
  const preparationCodes = new Set(['SOURCE_REFERENCE_MISMATCH', 'UNKNOWN_CITATION', 'DUPLICATE_REFERENCE',
    'INVALID_ROLES', 'INVALID_EVIDENCE', 'PRIVATE_DATA_IN_REPO', 'INPUT_TOO_LARGE', 'INVALID_ROUNDS', 'REVIEW_LOCKED']);
  if (preparationCodes.has(error.code)) console.error(JSON.stringify({ code: error.code, message: error.message }));
  else console.error('No se pudo preparar o guardar la revisión. Usa --chapter <archivo> --evidence <json> [--scope <archivo>] [--output <directorio>]. Datos privados fuera de Git.');
  process.exitCode = 1;
}
