export function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
export async function readJson(request, limit = 48000) {
  if (request.headers.get('origin') !== new URL(request.url).origin || !request.headers.get('content-type')?.startsWith('application/json'))
    throw Object.assign(new Error('Solicitud no permitida.'), { status: 403 });
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('Faltan datos.'), { status: 400 });
  let size = 0;
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw Object.assign(new Error('La solicitud es demasiado grande.'), { status: 413 }); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Datos inválidos.'), { status: 400 }); }
}
export function apiError(error) {
  return json({ error: [400, 403, 409, 413, 429].includes(error.status) ? error.message : 'No se pudo completar la operación. Tus datos guardados se conservan.' }, error.status ?? 500);
}
