# Estado del proyecto y continuidad

Fecha de corte: **31 de octubre de 2026**. Base de implementación inspeccionada: commit `d564a61`, más esta consolidación documental. Documento para retomar el trabajo sin reconstruir la conversación.

## Dónde estamos

Understandly tiene un primer recorrido de estudio local funcional en código, para **un estudiante, un curso y un capítulo de Docker**. Usa Astro SSR, React, patrones de shadcn/ui y adaptadores de los CLI de Codex y Claude.
La revisión 5 del capítulo 1 está aprobada según el historial privado y las entradas actuales. El lector volvió a comprobar `approved: true`, 11 secciones y 6 bloques de actividad durante esta revisión del repositorio. No se hicieron consultas a modelos para comprobarlo ni se modificó el manuscrito.
Todavía no se ha cerrado el piloto con el usuario: faltan la prueba visual real en desktop/móvil y una consulta real al tutor desde la pantalla. No hay release funcional publicada ni tags locales.

## Actualización del 31 de octubre: fase 1

En `feature/reader-improvements`, sin integrar: paneles colapsables por dispositivo, estado del capítulo con siguiente paso y cierre del tutor con resumen que el lector aprueba, edita o descarta. Pasan 47 pruebas unitarias, 5 de UI y 2 HTTP, además de tipos y build. El usuario confirmó el 31 de octubre en navegador real: paneles, modo lector, pregunta real al tutor, resumen editado y nota tras recargar. Móvil y accesibilidad siguen sin validar. Plan vigente: [plataforma](platform-plan.md) y [diseño](platform-design.md).

## Funciones disponibles

| Área | Implementado | Límite actual |
| --- | --- | --- |
| Lectura | Índice, Markdown saneado, tablas, diagrama Mermaid, alternativa textual, navegación y modo lectura | Lector específico del capítulo 1; no biblioteca ni selector de cursos |
| Comodidad | Papel/claro/noche, tamaño, ancho y serif opcional; preferencias por dispositivo | Diseño adaptable implementado, no validado visualmente con el usuario |
| Tutor contextual | Selección de texto, botón de sección y consulta del diagrama como texto; diálogo con seguimiento | Respuesta completa al terminar, sin streaming ni análisis de imágenes arbitrarias |
| Reformulación | Modo «No entiendo el enfoque» con otra explicación | No cambia ni versiona el manuscrito |
| Cuaderno | Guardar resumen aprobado de la conversación; conservar selección, sección y versión | No hay edición, borrado, búsqueda ni exportación desde la interfaz |
| Actividades | Guardar un intento antes de mostrar feedback; historial de intentos | No hay calificación automática ni certificación de competencias |
| Reanudación | Última sección guardada en el servidor; notas e intentos disponibles al recargar | Sin sincronización en vivo, sin progreso porcentual ni medición de retención |
| Runtime | Sesión predeterminada de Codex; token de suscripción de Claude; timeout y cancelación | Requiere conexión al proveedor; no ejecución local del modelo |
| Revisión editorial | Autor y revisor distintos; correcciones acotadas, informe antes/después y comprobación de fuentes | Parte de un manuscrito ya preparado, no genera un curso de principio a fin |
| Cierre de revisión | Reutiliza aprobación verificable con mismas entradas y roles | Historial privado necesario; no es publicación del curso |
| Compartir | Proceso separado, por defecto 4322, compatible con forward y de solo lectura | Comparte el capítulo y sus soluciones, sin datos personales ni ejecución de CLI |

## Último punto de trabajo

El usuario intentó compartir el puerto personal mediante un forward y recibió «Acceso disponible solo mediante una dirección local».
Se conservó la restricción en **4321** y se añadió `npm run share`, por defecto en **4322**. La vista compartida permite mostrar el material, bloquea todas las APIs y no lee ni serializa notas, intentos o posición. Se verificó HTTP 200 con cabeceras de host público y HTTP 403 para datos y tutoría.
No asumir que esos procesos o el forward sigan encendidos: no se instaló un servicio del sistema, supervisor ni arranque automático. Arrancar desde la raíz del repositorio según [desarrollo](development.md).

## Punto exacto de reanudación

La siguiente unidad de trabajo recomendada es **cerrar el recorrido del capítulo 1 con el usuario**:

1. Abrir el servicio personal, no la vista compartida.
2. Confirmar lectura, diagrama, teclado, selección y ajustes en desktop y móvil.
3. Hacer una pregunta real con el CLI elegido y confirmar manejo de errores.
4. Anclar una respuesta, guardar un intento y recargar para comprobar persistencia.
5. Corregir los defectos observados antes de producir más capítulos.

No volver a revisar el capítulo aprobado por sugerencias opcionales. No pedir nuevamente API keys facturables ni sustituir la sesión predeterminada de Codex. La lista de aceptación manual está en [roadmap.md](roadmap.md).

## Verificación del 31 de octubre

Los resultados de esta sección corresponden al código base inspeccionado; las modificaciones de esta entrega son documentales.

| Comprobación | Resultado | Qué demuestra |
| --- | --- | --- |
| Carga del capítulo desde datos locales | Revisión 5, aprobado, 11 secciones y 6 actividades | Correspondencia del manuscrito actual con una aprobación conservada |
| `npm test` | 45 pruebas unitarias + 3 pruebas UI, aprobadas | Contratos, límites, persistencia e interacción en DOM simulado |
| `npm run check` | Sin errores, advertencias ni hints | Comprobación de tipos de Astro/React |
| `npm run build` | Aprobada; aviso de chunks de más de 500 kB | Compilación SSR y cliente; Mermaid se importa de forma diferida |
| `npm run test:http` | 2 pruebas de integración aprobadas | Servicio compilado, CLI ficticio, guardado y aislamiento de la vista compartida |

Total: **50 pruebas automatizadas aprobadas**. La prueba HTTP no forma parte de `npm test`; se ejecuta después de construir.
Las pruebas UI usan happy-dom; no sustituyen una prueba de navegador, reflow, contraste ni lector de pantalla. Los intentos anteriores de iniciar Chromium/Edge automatizados fueron bloqueados por macOS (`MachPortRendezvous`); no se ha declarado una validación visual exitosa.
Los smoke reales de ambos CLI fueron confirmados previamente por el usuario. En esta consolidación no se ejecutaron smoke ni revisiones reales para evitar consumo innecesario. No hay evidencia registrada de una consulta real al modelo completada desde la pantalla.

## Git y entrega de código

Remote configurado: `https://github.com/marcelolsal/understandly.git`.
Al iniciar esta consolidación, la rama local era `fix/shared-readonly-preview`, con árbol limpio. Las ramas locales `main`, `staging` y `develop`, y sus referencias `origin/*`, apuntaban a `a0c3589`. No se hizo fetch ni una consulta nueva al servidor GitHub: esto describe referencias locales, no garantiza el estado remoto actual.
Las ramas de trabajo forman una historia lineal: la punta más reciente contiene los trabajos previos. **No integrar cada rama histórica como si fueran entregas independientes**: evitar PR redundantes y duplicación al hacer squash. Preparar una integración revisable desde una rama que contenga el conjunto final hacia develop.

| Commit | Hito |
| --- | --- |
| `a0c3589` | Especificación, instrucciones y workflow inicial |
| `0782434` | Alcance del piloto Docker |
| `6d1d99f` y `22d8410` | Runtime CLI y diagnóstico seguro |
| `0d2cf55` | Revisión editorial ligada a versiones |
| `5717700` | Correcciones automáticas acotadas y reportes claros |
| `0af83a2` | Cambio de dos revisores a autor/revisor |
| `53025f2` | Reutilización de aprobaciones para evitar repetir revisiones |
| `c389534` | Primera experiencia de estudio Astro |
| `d564a61` | Vista compartida aislada de solo lectura |

Esta documentación se prepara en `docs/project-handoff`. No se han realizado push, PR, merge ni tags como parte de esta entrega.
La protección de ramas fue verificada históricamente; no se volvió a comprobar en GitHub durante esta consolidación. Falta resolver la excepción de merge normal en sincronizaciones inversas hacia develop. Ver [versionado](versioning.md).

## Límites que no se deben olvidar

- El clon público no trae el material, las aprobaciones ni .env. Sin preparar los datos, el lector devuelve 503.
- Codex/Claude son servicios remotos invocados por procesos locales; el contexto enviado sale del equipo.
- El servicio personal no tiene autenticación y confía en el acceso local/LAN. La vista compartida no habilita acceso remoto al espacio personal.
- No hay ingesta/OCR, generador integral de cursos, catálogo, mapa de competencias, repasos, exportación ni restauración desde UI.
- No hay validación de dominio por guardar intentos. Las soluciones están en los datos de la página; su ocultación es para autoestudio, no para un examen seguro.
- El JSON de estudio tiene un único escritor por proceso; no soporta varias instancias escribiendo al mismo archivo.
- `docs/pilots/docker.md` está ligado por hash a la aprobación; sus notas operativas antiguas se interpretan como históricas.
- Una aprobación editorial no garantiza exactitud absoluta, accesibilidad de la aplicación ni aprendizaje del estudiante.
