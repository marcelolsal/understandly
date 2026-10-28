# Doble revisión de capítulos

Revisión de manuscritos mediante los CLI oficiales. No publica ni modifica capítulos, notas o progreso.

## Piloto Docker

Desde la raíz, con los materiales locales preparados:

```bash
npm run review:docker
```

Usa capítulo y evidencias de ../work/understandly-data/courses/docker/, fuera del repositorio. Estos archivos privados no se distribuyen al clonar GitHub. El alcance está en docs/pilots/docker.md.
Puede aumentarse UNDERSTANDLY_RUNTIME_TIMEOUT_MS en .env hasta 600000 para revisiones extensas. Consume uso de ambos planes y no reintenta ni cambia de cuenta.

Para otros materiales:

```bash
npm run review:chapter -- --chapter /ruta/capitulo.md --evidence /ruta/evidencias.json --scope /ruta/alcance.md
```

El scope por defecto es Docker: especificarlo para otros cursos. --output selecciona un directorio privado para resultados.
Evidencias: JSON con sources, lista no vacía de objetos con id numérico único (como string), url HTTPS y excerpt. Puede incluir título, fecha y procedencia. El manuscrito usa citas [1, 2] y referencias `1. https://...`. Antes de llamar a los modelos se exige correspondencia exacta entre identificadores y URL; duplicados y citas desconocidas se rechazan sin consumir uso.
Los revisores contrastan los extractos proporcionados, no visitan URLs. En Docker se prepararon paráfrasis tras consultar documentación oficial. Si no bastan, deben solicitar más evidencia. No se descargan URLs automáticamente ni se ejecutan instrucciones del material.

## Proceso

1. Congelar capítulo, alcance y evidencias; calcular SHA-256 de entradas, prompt y esquema.
2. Enviar idéntico prompt y contrato a ambos modelos, sin compartir su primer dictamen.
3. Validar estructura, siete criterios, chequeos de todas las fuentes y coherencia del veredicto.
4. Guardar cada resultado por separado, incluso cuando falla el otro.
5. Detectar cambios en las entradas durante la revisión e invalidar aprobación.
6. Aprobar solo si ambos emiten approved, todos los criterios pass, todas las fuentes supported y no hay objeciones blocking.

El consenso no garantiza verdad ni eficacia pedagógica. Es aprobación del manuscrito con evidencia proporcionada, no de una interfaz renderizada ni de retención del estudiante.

## Resultados

Cada ejecución crea una carpeta nueva bajo reviews junto al curso, con permisos privados:

- snapshot.json: entradas exactas.
- codex.json y claude.json: dictamen validado o fallo normalizado.
- manifest.json: huellas, estado, sesiones diagnósticas y resultados.
- report.md: resumen en español, observaciones obligatorias, sugerencias y propuestas de cada revisor.

Se conserva historial, sin tokens ni errores crudos. Si el CLI no informa qué modelo usó, se registra cli-default-not-reported en lugar de inventarlo.
Capítulo, evidencias y resultados se rechazan dentro de un repositorio Git, incluyendo worktrees y rutas resueltas mediante enlaces simbólicos.

| Estado | Significado |
| --- | --- |
| running | Ejecución incompleta; no es aprobación. |
| pending | Algún revisor falló o devolvió un dictamen inválido. |
| changes_required | Ambos respondieron, pero alguno exige cambios. |
| stale | Cambió una entrada durante el proceso. |
| approved | Ambos aprobaron esa versión; publicación separada. |

Código de salida 0 solo para aprobación conjunta, 1 para otros resultados. Ante una terminación abrupta, un manifiesto running no aprueba nada.
Después de observaciones se puede corregir manualmente o usar el ciclo automático descrito abajo. Nunca editar dictámenes para forzar consenso.

## Corrección y nueva revisión automáticas

```bash
npm run review:docker:auto
npm run review:docker:auto -- --max-rounds 5
```

También disponible con `review:chapter -- --chapter ... --evidence ... --scope ... --auto --max-rounds 3`.

Por defecto se realizan hasta 3 rondas de revisión, configurable entre 1 y 10. Cada ronda consulta a ambos revisores. Si ambos dan dictámenes válidos y alguno pide cambios concretos, Codex actúa como corrector: recibe las observaciones de ambos y propone un capítulo nuevo, con fragmentos antes/después, motivo y observaciones atendidas.
El corrector no cambia las evidencias ni los veredictos. Se verifican los fragmentos declarados, cobertura de objeciones bloqueantes, referencias y conservación de anclas. Se archiva la versión anterior y se aplica la corrección de forma atómica. Si el frontmatter contiene revision numérica, se incrementa automáticamente.
El comando auto muestra explicaciones en español en la terminal: resumen del dictamen, cambios obligatorios y sugerencias, propuestas y motivos de las correcciones. Para otros comandos puede activarse con --human. Sin esa opción se conservan los eventos JSON para integración futura.
Después, ambos revisores vuelven a evaluar la nueva versión sin recibir el dictamen inicial del otro. Una aprobación anterior no se transfiere a un capítulo modificado. La última ronda no aplica una corrección que no alcance a ser revisada.

El ciclo se detiene si:

- Ambos aprueban la misma versión.
- Se alcanza el máximo de rondas.
- Falta evidencia o hay contradicciones que requieren investigación.
- Un proveedor falla, alcanza su cuota o devuelve un dictamen inválido.
- Se repite una versión, solo cambian metadatos o no hay una corrección verificable.
- Cambian externamente capítulo, alcance o evidencias, o se cancela con Ctrl+C.

Esto evita perseguir un sí por azar. No hay retries de errores de conexión ni rotación automática de cuentas. Con 3 rondas el máximo normal es 6 revisiones y 2 correcciones; se detiene antes si procede.

Los resultados se conservan en auto-reviews junto al curso. cycle.json contiene el estado agregado y report.md explica por ronda qué pidió cada revisor, qué se cambió, el antes/después y por qué. Cada revisión también conserva sus propios artefactos; las propuestas aplicadas y copias anteriores están en la carpeta del ciclo.
Los estados adicionales incluyen max_rounds, needs_evidence, no_progress, needs_clarification, correction_failed y cancelled. Solo approved implica doble aprobación, nunca publicación automática.

Existe un lock de corrección por capítulo para evitar dos ciclos automáticos simultáneos. Se libera al terminar normalmente o cancelar. Si el proceso se mata abruptamente, puede quedar `<capitulo>.review-lock`; comprobar que no hay otro ciclo activo antes de retirarlo manualmente. Las ediciones externas no se sobrescriben si se detectan antes de aplicar la corrección.
Los registros iniciales de borrador fuera de Git son históricos: el estado de cada ejecución se lee de manifest.json o cycle.json y se contrasta con las huellas del contenido actual antes de publicar.

## Validación

Las pruebas usan dictámenes ficticios en carpetas temporales para comprobar aprobación doble, desacuerdos, fallos parciales, respuestas incoherentes, versiones cambiadas, conservación de historial y privacidad.
El usuario confirmó conexiones smoke correctas para ambos CLI. Eso no aprueba el capítulo. En el entorno restringido del agente, la primera revisión real quedó pending: Codex falló por permisos locales y Claude alcanzó un timeout de 20 segundos. Ejecutar desde la terminal del usuario y consultar los dictámenes.
