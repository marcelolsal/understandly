# Runtime local de CLI

Primera implementación autorizada: adaptador de consultas puntuales y herramientas de diagnóstico. No incluye todavía servidor HTTP, interfaz Astro, streaming hacia la interfaz ni revisión de cursos.

## Requisitos

- Node.js 22.16 o posterior; sin dependencias npm externas.
- Codex CLI instalado y autenticado normalmente con ChatGPT.
- Claude Code instalado y token propio en CLAUDE_CODE_OAUTH_TOKEN.
- Internet para consultar los modelos: ejecutar un proceso local no ejecuta el modelo localmente.

Se verificaron opciones de CLI con Codex 0.144.5 y Claude Code 2.1.312. Cambios de versión pueden requerir ajustar flags o parsers.

## Configuración

Conservar el .env existente; .env.example muestra las opciones sin secretos.
Las variables del entorno del servidor prevalecen sobre .env. No se expande shell ni se evalúan comandos del archivo.

| Variable | Uso |
| --- | --- |
| CLAUDE_CODE_OAUTH_TOKEN | Token enviado únicamente al proceso Claude. |
| UNDERSTANDLY_CODEX_BIN | Ejecutable, por defecto codex en PATH. |
| UNDERSTANDLY_CLAUDE_BIN | Ruta opcional; detecta ~/.local/bin/claude y después PATH. |
| UNDERSTANDLY_RUNTIME_TIMEOUT_MS | Tiempo máximo por consulta, 90000 por defecto; entre 1000 y 600000. |

Codex conserva su configuración y cuenta predeterminadas. No se introduce selección de cuenta ni se sobrescribe CODEX_HOME.
El runtime elimina del entorno hijo las variables de API de OpenAI y Anthropic y los tokens alternativos conocidos para no introducir facturación de API por herencia. Nunca cambia automáticamente de proveedor o cuenta.
La configuración predeterminada de Codex puede tener su propio proveedor: comprobar codex login status y la configuración del CLI si fue personalizada.
Claude recibe el token de configuración y usa safe mode, sin tools, MCP externos ni persistencia de sesiones. No usar --bare: ese modo no consume el token de suscripción.
No extraer tokens de navegadores ni leer credenciales internas desde el adaptador.

## Uso

Desde la raíz del repositorio:

```bash
npm test
npm run runtime:check
npm run runtime:smoke
printf '%s' 'Explica la diferencia entre imagen y contenedor.' | npm run runtime:ask -- codex
printf '%s' 'Explica la diferencia entre imagen y contenedor.' | npm run runtime:ask -- claude
```

check solo verifica ejecutables y presencia de configuración: NO valida la autenticación con el proveedor.
smoke envía una petición mínima real a cada proveedor, secuencialmente, y verifica una respuesta esperada. Consume uso del plan. Solo imprime éxito, duración o código de error, nunca las salidas crudas.
ask imprime la respuesta del modelo y termina con código distinto de cero al fallar. No usar prompts con secretos.

Importación para el servidor futuro:

```js
import { createRuntime, loadConfig } from '../src/runtime/index.mjs';

const runtime = createRuntime({ config: await loadConfig() });
const result = await runtime.ask({
  provider: 'claude',
  prompt: 'Explica qué es una imagen de contenedor.',
  signal: abortController.signal,
});
```

El consumidor debe crear su AbortController. La respuesta contiene provider, text, durationMs y, si el CLI lo emitió, sessionId. Es un identificador diagnóstico; estas ejecuciones no implementan reanudación de sesiones. La historia del curso deberá persistir en Understandly y enviarse como contexto explícito.

## Límites y errores

- Procesos mediante spawn con shell false; prompt por stdin, no interpolado en argumentos.
- Directorio temporal vacío por consulta, eliminado al terminar.
- Codex en sandbox read-only y ejecución efímera. Sigue siendo un agente: read-only no significa ausencia de herramientas; el runner hereda las políticas administradas del equipo.
- Claude desactiva herramientas y personalizaciones mediante flags oficiales, conservando autenticación. No se utilizan flags de bypass.
- Timeout, cancelación con AbortSignal y límite de salida combinada de 4 MiB.
- En POSIX se termina el grupo de procesos; en Windows no se garantiza terminar todos los descendientes. Soporte inicial validado en macOS.
- Errores normalizados: MISSING_TOKEN, CLI_NOT_FOUND, START_FAILED, TIMEOUT, CANCELLED, OUTPUT_LIMIT, CLI_FAILED, PROVIDER_ERROR, INVALID_RESPONSE, CONFIG_ERROR e INVALID_PROMPT.
- Errores no incorporan stdout, stderr, prompts ni entornos. El token de Claude se redacta si aparece literalmente en una respuesta.
- No hay reintentos automáticos, cola global ni fallback facturable. Los errores generales no siempre distinguen cuota, conexión y autenticación: requieren diagnóstico con el CLI oficial.
- Esto no es una frontera de aislamiento frente a todos los secretos del usuario. El CLI y el equipo deben ser confiables; los límites de herramientas y permisos requieren nueva revisión antes de servir peticiones de usuarios externos.

## Validación

Las pruebas automatizadas usan respuestas simuladas para comprobar el contrato y procesos Node locales para comprobar timeout, cancelación, stdin y límites. No representan una revisión pedagógica ni aprobación de OpenAI/Anthropic.
La comprobación real de conexión se realiza por separado mediante runtime:smoke; no guardar credenciales ni logs crudos en el repositorio.

Resultado en el entorno restringido de desarrollo: 12 pruebas automatizadas correctas y ambos ejecutables detectados. La prueba real, limitada a 20 segundos por proveedor, falló: Codex terminó con código distinto de cero y un indicador de error de permisos; Claude alcanzó el timeout. No se confirmó una respuesta remota ni se validó la autenticación del token. Repetir runtime:smoke en una terminal del usuario con acceso normal a sus credenciales y a internet; no debilitar el sandbox para forzar el resultado.

## Referencias oficiales

- https://learn.chatgpt.com/docs/non-interactive-mode
- https://learn.chatgpt.com/docs/auth
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/authentication
- https://code.claude.com/docs/en/legal-and-compliance
