# Understandly

Plataforma personal de aprendizaje con contenido estructurado, tutoría contextual y seguimiento del progreso.

## Estado

Definición del producto y primera implementación del adaptador CLI local. Todavía no existe interfaz de estudio ni una versión funcional publicada.
Esta documentación consolida las decisiones del usuario; no constituye una revisión conjunta de OpenAI y Anthropic.

## Documentación

- [Especificación del producto](docs/product-spec.md)
- [Versionado y releases](docs/versioning.md)
- [Instrucciones compartidas para asistentes](AGENTS.md)
- [Piloto Docker desde cero](docs/pilots/docker.md)
- [Runtime local: configuración, uso y límites](docs/cli-runtime.md)
- [Doble revisión de capítulos](docs/chapter-review.md)

## Base acordada

Astro + shadcn/ui. Acceso inicial por red local, preparado para acceso remoto posterior.
Tutoría mediante CLI oficiales: Codex con la sesión predeterminada y Claude Code con token de suscripción en .env. Las APIs directas quedan fuera de la primera implementación.
Materiales, cursos generados, conversaciones y progreso permanecen en almacenamiento local externo al repositorio.
Los datos enviados a una API se procesan fuera del equipo; almacenamiento local no significa procesamiento enteramente local.

## Próximo paso

Repositorio conectado al remoto con main, staging y develop. Verificados dos rulesets activos: PR obligatorio, sin bypass, force push ni borrado; squash hacia develop y merge commit hacia staging/main. La excepción para sincronizaciones inversas hacia develop sigue pendiente. No hay tags ni releases todavía.

Piloto elegido: Docker desde cero. Revisar el primer capítulo y conectar el runtime a una experiencia de estudio; todavía no hay interfaz.

## Runtime inicial

Con Node.js 22.16 o posterior, sin instalar dependencias:

```bash
npm test
npm run runtime:check
npm run runtime:smoke
```

La prueba smoke realiza consultas reales y puede consumir uso de los planes. El archivo .env existente permanece fuera de Git.
