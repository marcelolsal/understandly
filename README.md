# Understandly

Plataforma personal de aprendizaje con contenido estructurado, tutoría contextual y seguimiento del progreso.

## Estado

Definición del producto. Todavía no existe una aplicación ejecutable ni una versión funcional publicada.
Esta documentación consolida las decisiones del usuario; no constituye una revisión conjunta de OpenAI y Anthropic.

## Documentación

- [Especificación del producto](docs/product-spec.md)
- [Versionado y releases](docs/versioning.md)
- [Instrucciones compartidas para asistentes](AGENTS.md)
- [Piloto Docker desde cero](docs/pilots/docker.md)

## Base acordada

Astro + shadcn/ui. Acceso inicial por red local, preparado para acceso remoto posterior.
Tutoría mediante API con soporte previsto para OpenAI y Anthropic.
Materiales, cursos generados, conversaciones y progreso permanecen en almacenamiento local externo al repositorio.
Los datos enviados a una API se procesan fuera del equipo; almacenamiento local no significa procesamiento enteramente local.

## Próximo paso

Repositorio conectado al remoto con main, staging y develop. Verificados dos rulesets activos: PR obligatorio, sin bypass, force push ni borrado; squash hacia develop y merge commit hacia staging/main. La excepción para sincronizaciones inversas hacia develop sigue pendiente. No hay tags ni releases todavía.

Piloto elegido: Docker desde cero. Preparar y revisar el primer capítulo, y resolver los puntos abiertos antes de implementar.
