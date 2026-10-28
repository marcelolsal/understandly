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
Evidencias: JSON con sources, lista no vacía de objetos con id único, url HTTPS y excerpt. Puede incluir título, fecha y procedencia.
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
Después de observaciones: resolver diferencias con evidencia, corregir y ejecutar de nuevo. El intercambio entre modelos y las correcciones automáticas todavía no están implementados. Nunca editar dictámenes para forzar consenso.

## Validación

Las pruebas usan dictámenes ficticios en carpetas temporales para comprobar aprobación doble, desacuerdos, fallos parciales, respuestas incoherentes, versiones cambiadas, conservación de historial y privacidad.
El usuario confirmó conexiones smoke correctas para ambos CLI. Eso no aprueba el capítulo. En el entorno restringido del agente, la primera revisión real quedó pending: Codex falló por permisos locales y Claude alcanzó un timeout de 20 segundos. Ejecutar desde la terminal del usuario y consultar los dictámenes.
