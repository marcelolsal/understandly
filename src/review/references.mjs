import { RuntimeError } from '../runtime/process.mjs';

// Manuscript convention: numeric [1, 2] citations and `1. https://...` entries.
// Check mechanically before consuming either model's usage.
export function validateReferences(chapter, evidence) {
  const references = new Map();
  for (const match of chapter.matchAll(/^\s*(\d+)\.\s+(https:\/\/\S+)\s*$/gm)) {
    if (references.has(match[1]))
      throw new RuntimeError('DUPLICATE_REFERENCE', 'Una referencia está duplicada en el manuscrito.');
    references.set(match[1], match[2]);
  }
  const sources = new Map(evidence.sources.map(source => [source.id, source.url]));
  if (references.size !== sources.size || [...sources].some(([id, url]) => references.get(id) !== url))
    throw new RuntimeError('SOURCE_REFERENCE_MISMATCH', 'Las referencias numeradas del capítulo deben coincidir con los identificadores y URL de las evidencias.');
  for (const match of chapter.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
    for (const id of match[1].split(',').map(value => value.trim())) {
      if (!references.has(id))
        throw new RuntimeError('UNKNOWN_CITATION', 'Una cita numérica no tiene referencia y evidencia asociadas.');
    }
  }
}
