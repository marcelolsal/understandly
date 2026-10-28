# Versionado y releases

Usar tags Git con prefijo v y esquema MAJOR.MINOR.PATCH.

## Política

- v0.1.0: primer piloto funcional verificado; todavía no existe.
- Durante 0.x, incrementar MINOR para nuevas capacidades o cambios incompatibles; documentarlos explícitamente. PATCH para correcciones compatibles.
- v1.0.0: primera versión estable que cumple un alcance y contrato de compatibilidad definidos.
- Desde 1.0.0, MAJOR para cambios incompatibles, MINOR para funcionalidades compatibles y PATCH para correcciones compatibles.
- Preversiones: v0.1.0-alpha.1, v0.1.0-beta.1 u otras identificadas como tales.
- No crear tags funcionales por el solo hecho de guardar documentación.
- Cada tag publicado identifica un commit fijo: no moverlo ni reutilizarlo.
- Acompañar las versiones publicadas de GitHub Releases con novedades, correcciones, validación, problemas conocidos y pasos de actualización.
- Verificar flujos afectados antes de publicar.

## Datos y contenido

Versionar aplicación, esquema de datos y revisiones de cursos de manera independiente.
Registrar migraciones y compatibilidad. Respaldar los datos antes de migraciones que puedan afectarlos.
Volver al código de un tag anterior no revierte la base de datos.
Las aprobaciones de capítulos se vinculan a versiones de contenido, no al tag de la aplicación.

## Ramas

- main: estado estable.
- staging: validación previa a publicación.
- develop: integración de cambios.
- Ramas de trabajo: feature/*, fix/* o docs/* según el cambio.
- Ramas de trabajo hacia develop: PR con squash and merge.
- develop hacia staging y staging hacia main: PR con merge commit.
- Movimientos inversos entre ramas permanentes: merge commit mediante PR; la aplicación de esta excepción en GitHub está pendiente de resolver.
- Las tres ramas permanentes tienen PR obligatorio, sin bypass, force push ni borrado en GitHub. Rulesets verificados: 26008916 (develop, squash) y 26008917 (staging/main, merge). La excepción de movimientos inversos sigue pendiente.
- El commit inicial es el punto común de arranque de las tres ramas locales.

## Pendiente

Elegir automatización de releases y procedimiento de firma o verificación de tags.
No existe todavía una release ni una garantía de compatibilidad de ejecución.
