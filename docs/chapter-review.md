# Autoría y revisión de capítulos

Un proveedor redacta y corrige; otro revisa. Codex es autor y Claude revisor por defecto. Esta política sustituye la doble aprobación obligatoria; los registros históricos conservan su política original.

## Uso

Desde la raíz del repositorio:

```bash
npm run review:docker -- --human
npm run review:docker:auto
npm run review:docker:auto -- --max-rounds 3
npm run review:docker:auto -- --author claude --reviewer codex
```

El comando sin auto consulta solo al revisor y no modifica el manuscrito. Auto parte de un manuscrito ya preparado, lo revisa y encarga al autor las correcciones necesarias. No genera automáticamente un curso desde cero.
Si se especifica solo --author, el otro proveedor se asigna como revisor. Ambos deben ser distintos. Los roles se mantienen durante todo el ciclo; no hay rotación de cuentas ni fallback a API facturable.

Para otros materiales:

```bash
npm run review:chapter -- --chapter /ruta/capitulo.md --evidence /ruta/evidencias.json --scope /ruta/alcance.md --auto --human
```

El scope por defecto es Docker; especificarlo para otros cursos. --output selecciona el directorio privado para resultados. Capítulo, evidencias y resultados deben estar fuera de Git, también mediante enlaces simbólicos o worktrees. Los materiales del piloto están en ../work/understandly-data/courses/docker/ y no se distribuyen al clonar el repositorio.
Puede aumentarse UNDERSTANDLY_RUNTIME_TIMEOUT_MS en .env hasta 600000. Las consultas consumen uso de los planes.

## Proceso

1. El autor prepara un manuscrito con alcance, fuentes y actividades acordados.
2. Congelar capítulo, alcance y evidencias; registrar SHA-256 de entradas, prompt y esquema.
3. El revisor evalúa siete criterios y todas las fuentes. Entrega un dictamen con cambios obligatorios y sugerencias opcionales.
4. Si solicita cambios concretos y hay evidencia suficiente, el autor corrige. Debe explicar sección, antes/después, motivo e identificadores de observaciones atendidas.
5. Verificar referencias, anclas y cobertura de objeciones obligatorias; archivar el original y aplicar atómicamente. Incrementar revision si existe en frontmatter.
6. El revisor evalúa la nueva versión. Solo su dictamen válido sobre esa versión permite approved. Las sugerencias opcionales no generan correcciones tras una aprobación.

Se conserva la rúbrica: exactitud y fuentes, alcance, secuencia, explicaciones y visuales, práctica y feedback, evaluación, accesibilidad textual. Aprobar exige todos los criterios pass, todas las fuentes supported y cero objeciones blocking. No es aprobación de una interfaz renderizada ni prueba de aprendizaje.

Evidencias: JSON con sources, lista no vacía de objetos con id numérico único como string, url HTTPS y excerpt. El manuscrito usa citas [1, 2] y referencias `1. https://...`. Se comprueba correspondencia exacta de identificadores y URL antes de consultar al modelo.
El revisor contrasta los extractos suministrados: no visita URLs. Ante una afirmación esencial sin respaldo, solicita evidencia. No se descargan fuentes automáticamente ni se ejecutan instrucciones incrustadas en materiales.

## Cierre y ejecuciones repetidas

Auto busca primero una aprobación anterior con los mismos roles y las mismas entradas. Comprueba huellas de capítulo, alcance y evidencias, snapshot original, esquema y dictamen válido del revisor. Si coincide, devuelve approved con reused: true, enlaza el informe existente y termina sin llamar a los modelos ni crear otro ciclo. No modifica el manuscrito ni el historial.
Cambiar cualquiera de esas entradas o los roles requiere una nueva revisión. --output limita la búsqueda al historial de ese directorio. Para solicitar otra revisión deliberadamente:

```bash
npm run review:docker:auto -- --force-review
```

El comando sin --auto sigue realizando una revisión nueva a petición del usuario. Las sugerencias opcionales no requieren volver a ejecutar el ciclo.

## Límites y resultados

Por defecto hay hasta 3 rondas, configurable entre 1 y 10. Con 3 rondas el máximo normal es 3 revisiones y 2 correcciones (antes eran 6 revisiones y 2 correcciones). La última ronda no aplica una corrección sin posterior revisión. Esto reduce llamadas, pero no garantiza que un capítulo requiera menos rondas.
El ciclo se detiene ante aprobación, límite, evidencia insuficiente o contradictoria, fallos/cuotas, dictamen inválido, falta de progreso, cambios externos o cancelación con Ctrl+C. No reintenta errores de conexión ni busca un sí al azar.

Cada revisión conserva snapshot.json, manifest.json, report.md y el dictamen del proveedor asignado. El manifiesto incluye reviewers y policy. Sin modelo informado por el CLI se registra cli-default-not-reported.
Cada ciclo crea un directorio nuevo en auto-reviews con cycle.json (author, reviewer, policy), informe por ronda y copias antes/después. No guarda tokens ni errores crudos. Aprobaciones históricas no se reescriben.
Los informes distinguen autoría de aprobación del revisor; nunca presentan esta política como doble aprobación. Una modificación de capítulo, alcance o evidencia invalida el dictamen para la nueva entrada.

| Estado | Significado |
| --- | --- |
| approved | El revisor asignado aprobó la versión congelada; no publica. |
| changes_required | El revisor solicita cambios. |
| pending | Falta un dictamen válido. |
| stale | Cambió alguna entrada. |
| needs_evidence | Falta investigación; el autor no inventará evidencia. |
| max_rounds | Se agotó el límite. |
| no_progress | Se repite contenido o solo cambian metadatos. |
| needs_clarification | Rechazo sin objeción bloqueante concreta. |
| correction_failed | No se pudo obtener o verificar la corrección. |
| cancelled | Se canceló el ciclo. |
| running | Ejecución incompleta, sin aprobación. |

Código de salida 0 solo para approved. Un lock por capítulo impide ciclos automáticos simultáneos; se libera al finalizar o cancelar normalmente. Tras una terminación abrupta puede quedar `<capitulo>.review-lock`: comprobar que no hay un ciclo activo antes de retirarlo manualmente.
Los registros iniciales de borrador son históricos. Contrastar siempre huellas de manifest.json o cycle.json con las entradas actuales.

## Compatibilidad y validación

La función interna reviewChapter conserva como valor predeterminado la revisión doble para consumidores existentes; los comandos CLI y auto seleccionan explícitamente al único revisor asignado. Los informes antiguos sin policy se interpretan como dual_review.
Las pruebas usan respuestas ficticias para comprobar roles, aprobación, correcciones, límites, fallos, versiones y privacidad. No equivalen a consultas reales ni a aprobación pedagógica.
