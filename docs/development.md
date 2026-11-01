# Desarrollo, operación local y diagnóstico

Esta guía permite retomar el proyecto en otra sesión. Ejecutar comandos desde la raíz que contiene package.json. No hace falta mantener viva una conversación para usar la app.

## Preparar el entorno

1. Usar Node.js >=22.23.4 y npm; se construyó con Node 26.12.0. El lockfile fija la resolución de dependencias.
2. Ejecutar `npm ci`.
3. Conservar .env si existe. En una instalación nueva, crear uno a partir de .env.example y configurar las opciones necesarias sin publicarlo.
4. Preparar el directorio privado con el capítulo del piloto y su evidencia. Un clon de GitHub no los contiene.
5. Si se usará el tutor, instalar y autenticar los CLI oficiales en la cuenta del servidor. Ver [runtime CLI](cli-runtime.md).

No sobrescribir .env ni introducir credenciales de API facturable. Codex usa su cuenta predeterminada; Claude usa su token de suscripción. Los ejemplos de configuración del repositorio no contienen secretos.

| Variable | Valor por defecto / función |
| --- | --- |
| `UNDERSTANDLY_DATA_DIR` | `../work/understandly-data`, entorno o .env |
| `UNDERSTANDLY_CODEX_BIN` | `codex`, configurable en entorno o .env |
| `UNDERSTANDLY_CLAUDE_BIN` | Detección de `~/.local/bin/claude` y luego PATH |
| `CLAUDE_CODE_OAUTH_TOKEN` | Necesario para Claude; no imprimirlo |
| `UNDERSTANDLY_RUNTIME_TIMEOUT_MS` | 90000, entre 1000 y 600000 |
| `HOST` | Entorno del proceso; `127.0.0.1` en serve/share |
| `PORT` | Entorno del proceso; 4321 en serve, 4322 en share |
| `UNDERSTANDLY_SHARE_MODE` | El comando share fija `1` antes de cargar el servidor |

HOST y PORT de los scripts no se cargan explícitamente desde .env; exportarlos en la terminal o pasarlos al ejecutar. El modo compartido es una opción del proceso, no un parámetro de URL.

## Ejecutar

```bash
npm run dev
```

Desarrollo: http://localhost:4321. Astro recarga cambios; no confundir este comando con el servidor de la compilación.

```bash
npm run build
npm start
```

Compilación: http://127.0.0.1:4321. `npm start` requiere dist y no reconstruye automáticamente. Tras modificar código, detener ese proceso, construir y arrancar otra vez: no dejar un servidor antiguo apuntando a un dist reemplazado, porque puede referenciar assets que ya no existen.
Para LAN, usar `npm run dev -- --host 0.0.0.0` o `HOST=0.0.0.0 npm start`; abrir la IP privada del equipo en el teléfono. No reenviar ese puerto personal a internet.

```bash
npm run build
npm run share
```

Vista para mostrar a alguien: http://127.0.0.1:4322. Configurar el forward al **4322**. Este proceso es de solo lectura y bloquea APIs. Mantenerlo separado del servidor personal, con puertos distintos. No poner el modo compartido en el proceso donde se espera usar el tutor.
Los comandos anteriores se mantienen en primer plano: usar terminales separadas y Ctrl+C para detenerlos. No hay daemon, servicio de sistema, autorreinicio ni gestor de logs configurado por el proyecto. Los procesos lanzados por un agente en sesiones anteriores no son una garantía de disponibilidad.

## Comandos de trabajo

| Comando | Uso | ¿Consulta a modelos? |
| --- | --- | --- |
| `npm test` | Unitarias y UI en DOM simulado | No |
| `npm run test:unit` | Contratos y lógica | No |
| `npm run test:ui` | Interacción de componentes | No |
| `npm run check` | Tipos de Astro/React | No |
| `npm run build` | Compilación | No |
| `npm run test:http` | Integración sobre dist, puertos 14327/14328, archivos y CLI ficticios | No |
| `npm run runtime:check` | Ejecutables/configuración; no prueba autenticación | No |
| `npm run runtime:smoke -- codex` | Prueba mínima real de Codex | Sí |
| `npm run runtime:smoke -- claude` | Prueba mínima real de Claude | Sí |
| `npm run runtime:ask -- codex` | Prompt recibido por stdin | Sí |
| `npm run review:docker -- --human` | Revisión nueva por el revisor asignado | Sí |
| `npm run review:docker:auto` | Reutilizar aprobación o revisar/corregir hasta el límite | Si no hay aprobación reutilizable |
| `npm run review:docker:auto -- --author claude --reviewer codex` | Roles usados en la aprobación más reciente verificada del piloto | Si no hay aprobación reutilizable |

La UI busca aprobación válida en cualquiera de las dos asignaciones. Ejecutar el comando con roles diferentes puede iniciar otra revisión aunque el otro reparto ya haya aprobado. No hacerlo solo para ver si cambia el resultado. `--force-review` solicita deliberadamente una revisión nueva.

## Validar un cambio

Elegir comprobaciones según el área afectada. Para una entrega funcional que toca pantalla, API o datos:

```bash
npm test
npm run check
npm run build
npm run test:http
```

Después hacer una prueba manual del flujo afectado. Las simulaciones no acreditan una respuesta real del proveedor ni apariencia correcta en un navegador.
En una entrega solo documental, revisar enlaces, coherencia, ejemplos y diferencia entre estado/acuerdos/propuestas. No ejecutar revisiones editoriales de pago para validar Markdown de documentación.
Las pruebas de integración escriben datos ficticios en carpetas temporales y usan CLI ficticio; no deben tocar el progreso del usuario. Si están ocupados los puertos 14327/14328, identificar sus procesos antes de ejecutar otra instancia; no matar procesos ajenos automáticamente.

## Diagnóstico

| Síntoma | Comprobar y actuar |
| --- | --- |
| El enlace no carga | Confirmar proceso activo en la terminal; `curl -I http://127.0.0.1:4321`; revisar puerto y host |
| `EADDRINUSE` | `lsof -nP -iTCP:4321 -sTCP:LISTEN` en macOS; identificar al dueño y detener la instancia correspondiente o elegir otro PORT |
| Página sin estilos o interacciones después de compilar | Detener el servidor compilado anterior y arrancar el build actual; recargar la página |
| HTTP 503 con mensaje de configuración | Revisar directorio privado, ubicación del capítulo, permisos y formato del estado; no borrar datos existentes |
| «Acceso disponible solo mediante una dirección local» | Se está reenviando el servicio personal. Usar share y forward al 4322 |
| «Este servidor requiere acceso local directo» | El modo personal recibió cabeceras de proxy. No quitar la protección; usar la vista compartida para mostrar el material |
| Guardar/preguntar devuelve 403 en preview | Comportamiento esperado de solo lectura; usar 4321 para el estudio personal |
| Guardado devuelve 409 | Cambió la versión del manuscrito: conservar texto aún no guardado y recargar |
| Tutor devuelve 429 | Existe otra consulta en ese proceso; esperar, no crear retries en bucle |
| Tutor falla por timeout, cuota o autenticación | Consultar diagnóstico del runtime y la sesión oficial; no mostrar .env ni stderr crudo al cliente |
| Revisión `needs_evidence` | Investigar evidencia real y documentarla; el corrector no inventará fuentes |
| Revisión `max_rounds` o `no_progress` | Leer report.md y las objeciones; resolver una causa concreta antes de otro ciclo |
| Revisión `REVIEW_LOCKED` | Comprobar que no existe otro ciclo activo; solo entonces retirar un lock abandonado |
| Ya está aprobado y vuelve a revisar | Verificar roles, directorio de historial y huellas de capítulo/alcance/evidencia; no editar dictámenes |
| npm informa problemas de caché/permisos | Usar una caché escribible con `npm ci --cache /tmp/understandly-npm-cache`; no cambiar propietarios de carpetas del usuario sin necesidad |
| El navegador automatizado falla por permisos de macOS | Registrar la limitación y probar manualmente; no declarar validación visual ni debilitar el sandbox |

No asumir que un error del entorno restringido del agente significa que el token del usuario está mal. Históricamente ambos CLI funcionaron en su terminal.

## Git y documentación

Comenzar con `git status` y revisar la rama. Trabajar en feature/fix/docs, sin commits directos ni push a main, staging o develop. La integración hacia develop es por PR con squash; las promociones son por PR con merge commit. No crear tags de versión funcional hasta cerrar un alcance verificado.
La historia actual contiene ramas apiladas; consultar [estado](project-status.md) antes de preparar PR. Verificar el remoto antes de sincronizar, sin force push ni rebase de historia compartida.
Actualizar [estado](project-status.md), [roadmap](roadmap.md), contratos y decisiones cuando cambien. Mantener .env y datos privados fuera de Git. No modificar el alcance congelado del piloto por una corrección operativa sin considerar su aprobación.
