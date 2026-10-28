import { defineMiddleware } from 'astro:middleware';
import { isSharedPreview } from './server/access.mjs';

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  if (isSharedPreview()) {
    if (!['GET', 'HEAD'].includes(request.method) || url.pathname !== '/')
      return new Response(JSON.stringify({ error: 'Vista compartida de solo lectura. Los datos personales y la tutoría no están disponibles.' }), {
        status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    const response = await next();
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }
  let host: string;
  try { host = new URL(`http://${request.headers.get('host')}`).hostname; }
  catch { return new Response('Host inválido.', { status: 403 }); }
  if (request.headers.has('x-forwarded-host')) return new Response('Este servidor requiere acceso local directo.', { status: 403 });
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host) || /^192\.168\.\d+\.\d+$/.test(host) || /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host);
  if (!local) return new Response('Acceso disponible solo mediante una dirección local.', { status: 403 });
  if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('origin') !== url.origin)
    return new Response('Origen no permitido.', { status: 403 });
  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
});
