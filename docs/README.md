# Documentación de Understandly

Punto de entrada para entender el proyecto y continuarlo con Codex, Claude o cualquier colaborador. Estado consolidado: **31 de octubre de 2026**. No contiene materiales académicos privados, notas del estudiante ni credenciales.

## Empezar por aquí

| Necesito… | Leer |
| --- | --- |
| Retomar el trabajo sin depender de esta conversación | [Estado y continuidad](project-status.md) |
| Entender objetivos, acuerdos y límites del producto | [Especificación](product-spec.md) |
| Instalar, ejecutar, diagnosticar y validar cambios | [Guía de desarrollo](development.md) |
| Saber qué hace cada módulo y dónde modificarlo | [Arquitectura](architecture.md) |
| Trabajar con materiales, persistencia o endpoints | [Datos y API](data-and-api.md) |
| Elegir el siguiente trabajo y saber cuándo está terminado | [Hoja de ruta](roadmap.md) |
| Entender por qué cambiamos de enfoque | [Registro de decisiones](decisions/README.md) |
| Configurar los proveedores CLI | [Runtime CLI](cli-runtime.md) |
| Preparar, revisar y cerrar un capítulo | [Autor y revisor](chapter-review.md) |
| Usar la pantalla, la red local o un forward | [Pantalla de estudio](study-reader.md) |
| Trabajar con ramas, PR y tags | [Versionado](versioning.md) y [configuración de GitHub](../ops/github/README.md) |
| Entender el alcance académico del piloto | [Piloto Docker](pilots/docker.md) |
| Conocer instrucciones compartidas por agentes | [AGENTS.md](../AGENTS.md); Claude entra por [CLAUDE.md](../CLAUDE.md) |

## Orden recomendado para un agente nuevo

1. Leer AGENTS.md y el README de la raíz.
2. Leer [estado y continuidad](project-status.md), especialmente el punto de reanudación.
3. Leer la especificación y el versionado; distinguir acuerdos de propuestas.
4. Abrir la arquitectura y el documento del flujo que se vaya a tocar.
5. Comprobar Git y archivos reales antes de editar. No asumir que un proceso, token, aprobación o remote sigue en el estado descrito.

## Fuentes de verdad

- Los requisitos vigentes están en la especificación; las instrucciones de trabajo, en AGENTS.md.
- El comportamiento ejecutable lo determinan el código y package.json. Informar discrepancias; no presentar una propuesta como funcionalidad implementada.
- El inventario de avances, limitaciones y verificación fechada está en project-status.md.
- Los materiales y aprobaciones efectivas viven fuera de Git. La documentación pública describe su formato, no sustituye los dictámenes privados.
- La hoja de ruta propone el orden de avance. No autoriza por sí misma despliegues, cambios de alcance académico ni modificaciones de cuentas.

## Documento de alcance congelado

[docs/pilots/docker.md](pilots/docker.md) participa en el cálculo de la huella de aprobación del capítulo. Conserva notas históricas, como «todavía no hay interfaz» y la revisión doble inicial. **No usar esas notas como estado vigente**: el estado actual está en [project-status.md](project-status.md) y la política actual en [chapter-review.md](chapter-review.md).
No se ha editado ese archivo durante esta consolidación para evitar invalidar la aprobación por cambios meramente documentales. Si se modifica deliberadamente, revisar el efecto sobre las aprobaciones. Separar el alcance académico de las notas operativas es una mejora pendiente.

## Cómo mantener esta documentación

Al cambiar una función, actualizar su guía operativa, los contratos afectados y el estado del proyecto. Al tomar una decisión, registrar motivo, consecuencias y alternativas sustituidas. Las validaciones deben indicar fecha y diferenciar simulación, integración HTTP, CLI real y navegador real.
No guardar prompts reales, informes de cursos, capturas privadas, tokens o datos del estudiante en este repositorio público. Los ejemplos nuevos deben ser ficticios.
