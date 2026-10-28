# Understandly

Plataforma personal de aprendizaje con contenido estructurado, tutoría contextual y seguimiento del progreso.

## Estado

Definición del producto. Todavía no existe una aplicación ejecutable ni una versión funcional publicada.
Esta documentación consolida las decisiones del usuario; no constituye una revisión conjunta de OpenAI y Anthropic.

## Documentación

- [Especificación del producto](docs/product-spec.md)
- [Versionado y releases](docs/versioning.md)
- [Instrucciones compartidas para asistentes](AGENTS.md)

## Base acordada

Astro + shadcn/ui. Acceso inicial por red local, preparado para acceso remoto posterior.
Tutoría mediante API con soporte previsto para OpenAI y Anthropic.
Materiales, cursos generados, conversaciones y progreso permanecen en almacenamiento local externo al repositorio.
Los datos enviados a una API se procesan fuera del equipo; almacenamiento local no significa procesamiento enteramente local.

## Próximo paso

Repositorio inicializado localmente con main, staging y develop desde un commit común. La conexión al remoto y las protecciones de GitHub quedan pendientes. No hay tags ni releases todavía.

Elegir un curso piloto y resolver los puntos abiertos de la especificación antes de implementar.
