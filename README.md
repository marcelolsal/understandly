# Understandly

Plataforma personal de aprendizaje con contenido estructurado, tutoría contextual y seguimiento del progreso.

## Estado

Primera pantalla local de estudio en Astro: lectura de Docker, preguntas contextuales mediante CLI, ejercicios, notas y reanudación. Todavía no existe una versión funcional publicada ni se ha completado la validación visual con el usuario.
Esta documentación consolida las decisiones del usuario; no constituye una revisión conjunta de OpenAI y Anthropic.

## Documentación

Empieza por el [índice de documentación](docs/README.md) o por el [estado y guía de continuidad](docs/project-status.md), actualizado al 31 de octubre de 2026.

- [Especificación y acuerdos del producto](docs/product-spec.md)
- [Arquitectura y mapa del código](docs/architecture.md)
- [Desarrollo, comandos y diagnóstico](docs/development.md)
- [Datos, persistencia y API](docs/data-and-api.md)
- [Hoja de ruta y criterios de cierre](docs/roadmap.md)
- [Registro de decisiones](docs/decisions/README.md)
- [Runtime CLI](docs/cli-runtime.md), [revisión editorial](docs/chapter-review.md) y [pantalla de estudio](docs/study-reader.md)
- [Versionado y releases](docs/versioning.md), [AGENTS.md](AGENTS.md) y [piloto Docker](docs/pilots/docker.md)

## Base acordada

Astro + shadcn/ui. Acceso inicial por red local, preparado para acceso remoto posterior.
Tutoría mediante CLI oficiales: Codex con la sesión predeterminada y Claude Code con token de suscripción en .env. Las APIs directas quedan fuera de la primera implementación.
Materiales, cursos generados, conversaciones y progreso permanecen en almacenamiento local externo al repositorio.
Los datos enviados a una API se procesan fuera del equipo; almacenamiento local no significa procesamiento enteramente local.

## Próximo paso

Repositorio conectado al remoto con main, staging y develop. Dos rulesets se verificaron históricamente: PR obligatorio, sin bypass, force push ni borrado; squash hacia develop y merge commit hacia staging/main. La excepción para sincronizaciones inversas hacia develop sigue pendiente. No hay tags locales ni una release funcional verificada. El estado remoto debe comprobarse antes de integrar.

Piloto elegido: Docker desde cero. Primer capítulo conectado a la pantalla de estudio; validar comodidad en desktop/móvil y tutoría real con el usuario. Consulta [Pantalla de estudio](docs/study-reader.md).

Para mostrar el capítulo mediante un forward: `npm run build` y `npm run share`, y reenviar el puerto **4322**. La vista compartida es de solo lectura y no expone notas ni los CLI.

## Runtime inicial

Con Node.js 22.23.4 o posterior (se usó Node 26.12.0):

```bash
npm ci
npm run dev
```

Abre http://localhost:4321. Los materiales deben existir fuera del repositorio. Detalles en [Pantalla de estudio](docs/study-reader.md).

```bash
npm test
npm run runtime:check
npm run runtime:smoke
```

La prueba smoke realiza consultas reales y puede consumir uso de los planes. El archivo .env existente permanece fuera de Git.
