import { join } from 'node:path';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { dataRoot } from './settings.mjs';
import { outsideGit, readBounded, sha256 } from '../review/index.mjs';
import { findApproval } from '../review/approval.mjs';

const cleanHtml = value => sanitizeHtml(marked.parse(value), {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'details', 'summary'],
  allowedAttributes: { a: ['href', 'title'], code: ['class'], h2: ['id'], h3: ['id'] },
  allowedSchemes: ['https', 'http', 'mailto'],
  transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
});

export function parseChapter(markdown) {
  const title = /^title:\s*(.+)$/m.exec(markdown)?.[1] ?? 'Tu capítulo';
  const revision = Number(/^revision:\s*(\d+)/m.exec(markdown)?.[1] ?? 0);
  const content = markdown.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const matches = [...content.matchAll(/^## (.+?)(?: \{#([^}]+)\})?\s*$/gm)];
  const sections = matches.map((match, index) => {
    const id = match[2] ?? `seccion-${index + 1}`;
    const body = content.slice(match.index + match[0].length, matches[index + 1]?.index ?? content.length).trim();
    const parts = [];
    let cursor = 0;
    const pattern = /```mermaid\n([\s\S]*?)```|<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
    for (const chunk of body.matchAll(pattern)) {
      if (chunk.index > cursor) parts.push({ type: 'html', html: cleanHtml(body.slice(cursor, chunk.index)) });
      if (chunk[1]) parts.push({ type: 'diagram', source: chunk[1].trim() });
      else parts.push({ type: 'exercise', id: `${id}-${parts.filter(p => p.type === 'exercise').length + 1}`, label: chunk[2].trim(), html: cleanHtml(chunk[3]) });
      cursor = chunk.index + chunk[0].length;
    }
    if (cursor < body.length) parts.push({ type: 'html', html: cleanHtml(body.slice(cursor)) });
    if (id === 'comprobacion') parts.push({ type: 'exercise', id: 'comprobacion-final', label: 'Revisar mi razonamiento', html: '<p>Contrasta tu respuesta con las tres distinciones: origen e instancia, kernel compartido y conservación o eliminación de la capa. Puedes pedir al tutor feedback sobre tu intento. Guardarlo no implica haber demostrado las competencias.</p>' });
    return { id, title: match[1], body, parts };
  });
  return { id: 'docker-capitulo-01', title, revision, version: sha256(markdown), sections,
    readingMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 180)) };
}

export async function loadChapter() {
  const root = await dataRoot();
  const chapterPath = join(root, 'courses/docker/chapters/01-modelo-mental.md');
  await outsideGit(chapterPath);
  const markdown = await readBounded(chapterPath);
  const chapter = parseChapter(markdown);
  const options = { output: join(root, 'courses/docker/auto-reviews'), chapterPath,
    scopePath: 'docs/pilots/docker.md', evidencePath: join(root, 'courses/docker/source-evidence.json') };
  let approval = null;
  try {
    approval = await findApproval({ ...options, author: 'claude', reviewer: 'codex' }) ??
      await findApproval({ ...options, author: 'codex', reviewer: 'claude' });
  } catch { /* Reading remains available if approval evidence is unavailable. */ }
  return { ...chapter, approved: !!approval };
}
