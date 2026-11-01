import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { dataRoot } from './settings.mjs';
import { outsideGit, save } from '../review/index.mjs';

export const initialState = () => ({ schema: 1, notes: [], attempts: [], position: null, visited: [] });
let queue = Promise.resolve();
export async function statePath() {
  const root = await dataRoot();
  await outsideGit(root);
  const directory = join(root, 'study');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await outsideGit(directory);
  return join(directory, 'docker-capitulo-01.json');
}
export async function readState(path) {
  path ??= await statePath();
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return initialState(); throw error; }
}
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export function applyAction(state, action, chapter) {
  if (!action || action.version !== chapter.version) throw Object.assign(new Error('El capítulo cambió. Recarga antes de guardar.'), { status: 409 });
  const section = chapter.sections.find(s => s.id === action.section);
  if (!section) throw Object.assign(new Error('Sección inválida.'), { status: 400 });
  const at = new Date().toISOString();
  if (action.type === 'note' && text(action.selection, 3000) && text(action.question, 2000) && text(action.answer, 16000)) {
    state.notes.push({ id: randomUUID(), section: section.id, version: chapter.version,
      selection: action.selection, question: action.question, answer: action.answer, createdAt: at });
  } else if (action.type === 'attempt' && text(action.answer, 8000) && section.parts.some(p => p.type === 'exercise' && p.id === action.exercise)) {
    state.attempts.push({ id: randomUUID(), exercise: action.exercise, section: section.id,
      version: chapter.version, answer: action.answer, assisted: !!action.assisted, createdAt: at });
  } else if (action.type === 'position') {
    state.position = { section: section.id, version: chapter.version, updatedAt: at };
    state.visited ??= []; // Files written before this field existed stay valid.
    if (!state.visited.some(v => v.section === section.id && v.version === chapter.version))
      state.visited.push({ section: section.id, version: chapter.version });
  } else throw Object.assign(new Error('No se pudo guardar: datos inválidos.'), { status: 400 });
  return state;
}
export async function updateState(action, chapter, path) {
  const next = queue.then(async () => {
    path ??= await statePath();
    const state = applyAction(await readState(path), action, chapter);
    await save(path, state);
    return state;
  });
  queue = next.catch(() => {});
  return next;
}
