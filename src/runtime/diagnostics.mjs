import { RuntimeError } from './process.mjs';

export function claudeTokenFormat(token) {
  if (!token) return 'missing';
  if (token.startsWith('sk-ant-oat')) return 'subscription_oauth';
  if (token.startsWith('sk-ant-api')) return 'api_key_not_subscription';
  return 'unrecognized';
}

// Inspect errors privately and return only fixed messages, never the source text.
export function providerFailure(provider, result) {
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const rules = [
    ['INVALID_CLI_OPTIONS', /unknown option|unexpected argument|unrecognized (?:argument|option)|invalid.*option/i,
      'El CLI no admite alguna opción del adaptador. Comprueba su versión.'],
    ['AUTH_FAILED', /invalid.*(?:token|api.?key)|(?:token|api.?key).*?(?:expired|invalid)|unauthorized|authentication[_ -]error|oauth.*error|not logged in|please.*log.?in|\b401\b/i,
      'Autenticación rechazada. Para Claude utiliza el token completo de claude setup-token.'],
    ['USAGE_LIMIT', /rate[_ -]?limit|usage limit|quota exceeded|hit your limit|\b429\b/i,
      'El proveedor alcanzó un límite de uso. No se cambiará de cuenta ni de facturación.'],
    ['LOCAL_PERMISSION_ERROR', /permission denied|operation not permitted|\bEACCES\b|\bEPERM\b/i,
      'El CLI no tiene acceso a un recurso local necesario.'],
    ['NETWORK_ERROR', /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|fetch failed|failed to connect|network error|unable to connect|connection error/i,
      'No se pudo conectar con el proveedor. Comprueba la red.']
  ];
  for (const [code, pattern, message] of rules) {
    if (pattern.test(output)) return new RuntimeError(code,
      code === 'AUTH_FAILED' && provider === 'codex'
        ? 'Autenticación rechazada. Revisa la sesión predeterminada de Codex.' : message);
  }
  return new RuntimeError('CLI_FAILED', `${provider} terminó con error. No se ha identificado la causa sin exponer su salida privada.`);
}
