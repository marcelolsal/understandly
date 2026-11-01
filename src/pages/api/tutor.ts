import { isSharedPreview } from '../../server/access.mjs';
import { loadChapter } from '../../server/chapter.mjs';
import { askTutor } from '../../server/tutor.mjs';
import { readJson, json, apiError } from '../../server/http.mjs';
import type { APIRoute } from 'astro';
export const POST: APIRoute = async ({ request }) => {
  if (isSharedPreview()) return json({ error: 'Vista compartida de solo lectura.' }, 403);
  try { return json(await askTutor(await readJson(request), await loadChapter(), request.signal)); }
  catch (error) { return apiError(error); }
};
