import { loadChapter } from '../../server/chapter.mjs';
import { readState, updateState } from '../../server/store.mjs';
import { json, readJson, apiError } from '../../server/http.mjs';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try { return json(await readState()); } catch (error) { return apiError(error); }
};
export const POST: APIRoute = async ({ request }) => {
  try { return json(await updateState(await readJson(request), await loadChapter())); }
  catch (error) { return apiError(error); }
};
