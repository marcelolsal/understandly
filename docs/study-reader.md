# Primera pantalla de estudio

Autorizada por el usuario el 28 de octubre de 2026. Piloto local de un curso y un estudiante. No es todavía una versión publicada ni una acreditación de dominio.

## Abrir

Node.js >=22.23.4; se verificó con 26.12.0. Desde la raíz del repositorio:

```bash
npm ci
npm run dev
```

Abrir http://localhost:4321. Para usar la compilación:

```bash
npm run build
npm start
```

Por defecto escucha solo en el equipo. Para acceder desde el teléfono conectado a una red doméstica de confianza:

```bash
npm run dev -- --host 0.0.0.0
```

Usar http://IP-LOCAL-DEL-SERVIDOR:4321 en el teléfono. La compilación admite HOST=0.0.0.0 y PORT=4321 al ejecutar npm start. Solo se aceptan localhost, loopback e IP privadas; no nombres públicos ni proxy. Las cabeceras de proxy no están soportadas. No hay autenticación de usuarios en este piloto: cualquiera con acceso al servicio en esa red puede ver o modificar los datos del único estudiante y consultar los CLI. No exponer a internet; el acceso remoto requiere otra fase.

## Datos y configuración

UNDERSTANDLY_DATA_DIR se lee de la variable de entorno o de .env; por defecto ../work/understandly-data, relativo a la raíz del proyecto desde la que se ejecuta el comando.

Dentro de ese directorio:

- courses/docker/chapters/01-modelo-mental.md: manuscrito privado, leído al solicitar la página.
- courses/docker/source-evidence.json y auto-reviews/: evidencias de aprobación.
- study/docker-capitulo-01.json: notas, intentos y última sección de lectura.

No se copia el material a public, al repositorio ni a la compilación estática. Los datos de estudio se escriben atómicamente, serializados dentro del único proceso del servidor. No ejecutar varias instancias contra el mismo JSON. Un error al leer datos existentes no los reinicia ni sobrescribe silenciosamente.
El formato inicial schema:1 no tiene migraciones automáticas. Respaldar el directorio para conservar todo el historial. Las preferencias de lectura se guardan en localStorage del dispositivo. Las notas e intentos se comparten entre dispositivos al recargar; no hay sincronización en vivo.
El proyecto clonado no contiene el material privado: sin él aparece una pantalla de configuración con HTTP 503.

## Recorrido

- Índice de secciones, capítulos futuros identificados como pendientes y modo lectura que oculta paneles.
- Temas papel/claro/noche, tamaño y ancho de texto, tipografía opcional con serifas. Preferencias por dispositivo.
- Markdown saneado y tablas desplazables; Mermaid se carga de forma diferida y dispone de la alternativa textual del manuscrito.
- Selección de texto dentro de una sección activa Preguntar sobre esto o No entiendo el enfoque. También hay un botón por sección, utilizable con teclado, y otro en el diagrama.
- El diálogo mantiene la pregunta y la respuesta, admite seguimiento y permite anclar la última respuesta. La opción de reformular ofrece otro enfoque: no modifica el manuscrito ni su aprobación.
- Se debe guardar un intento antes de mostrar el bloque de feedback de cada actividad. El historial del intento queda guardado. No se asigna nota ni se afirma dominio automáticamente.
- Se guarda la última sección para reanudar al recargar, mientras siga siendo la misma versión. Las notas de versiones anteriores se conservan con su etiqueta; no se reasignan silenciosamente.

El Markdown original no cambia. Su frontmatter y algunas frases históricas describen una interfaz todavía pendiente o una doble aprobación anterior. El encabezado de la pantalla muestra el estado actual obtenido de los registros, sin reescribir esos bytes. La aprobación del manuscrito no aprueba la accesibilidad de esta interfaz.
La ocultación de soluciones es una ayuda para autoestudio: no es un sistema seguro de exámenes. Las soluciones forman parte de los datos de la página y pueden inspeccionarse con herramientas del navegador. En la comprobación independiente la app registra el razonamiento; aún no hay evaluación automática por competencia ni medición de retención.

## Tutor

/api/tutor ejecuta exclusivamente el adaptador existente, con proveedor validado, sin shell, sin herramientas del modelo y con timeout. Solo permite una consulta simultánea en el servidor. No hay API facturable de respaldo ni reintentos automáticos.
Codex usa la sesión predeterminada. Claude usa CLAUDE_CODE_OAUTH_TOKEN en .env. Las credenciales permanecen en el servidor.
Se envían al proveedor el fragmento seleccionado, la pregunta, hasta cuatro intercambios anteriores, la sección correspondiente sin bloques de soluciones y un índice de temas. El usuario elige el proveedor antes de preguntar. Al cerrar la consulta se aborta la petición; el proceso también queda limitado por timeout. Una consulta se registra como ayuda consultada en esa sesión, incluso si falla; no se presume independencia del desempeño.
La lectura, los ejercicios y las notas no dependen de disponibilidad del proveedor. No se ha implementado funcionamiento sin conexión al servidor.
Esta fase permite preguntar por texto y por el diagrama como estructura textual; no incluye carga ni análisis de capturas o imágenes arbitrarias.

## Protección y validación

Se rechazan orígenes distintos, cuerpos grandes, proveedores desconocidos y guardados sobre versiones obsoletas. Las escrituras requieren JSON y Origin del mismo servidor. El middleware valida el Host local original, desactiva caché de páginas privadas y evita enmarcado. Las respuestas del tutor y las notas se muestran como texto; el material Markdown pasa por saneamiento de HTML.
No se permiten rutas de archivos ni comandos elegidos por el navegador. No hay endpoint para leer .env. Los errores públicos son mensajes controlados.

```bash
npm test
npm run test:ui
npm run check
npm run build
npm run test:http
```

Las pruebas de UI usan un DOM simulado, no un navegador renderizado. Verifican guardar antes de revelar feedback, consulta y anclado, y persistencia de preferencias. La integración HTTP usa datos ficticios y un CLI ficticio: no consume planes ni acredita una respuesta real del modelo. Las pruebas originales del runtime siguen verificando el contrato de los dos proveedores.
La compilación y las pruebas HTTP se ejecutaron localmente. La ejecución de Chromium/Edge automatizados fue bloqueada por los permisos de macOS (MachPortRendezvous). Quedan pendientes comprobación visual real en desktop/móvil, contraste renderizado, zoom/reflow y experiencia con lector de pantalla; no se declara conformidad WCAG.

Antes de cerrar el piloto: comprobar contigo lectura prolongada, navegación por teclado, selección, consultas reales, guardado de notas, registro de intentos y reanudación en ambos dispositivos.
