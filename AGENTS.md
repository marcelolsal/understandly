# Instrucciones compartidas para agentes

Leer README.md, docs/project-status.md, docs/product-spec.md y docs/versioning.md antes de trabajar. docs/README.md contiene la ruta de lectura, contratos, arquitectura y pendientes. Comprobar el código y Git actual; el estado documentado es una instantánea fechada.
La especificación identifica decisiones acordadas, propuestas y cuestiones abiertas. Consultar docs/decisions/README.md para el motivo de los acuerdos y docs/roadmap.md para los siguientes criterios de cierre.

## Alcance actual

Autorizados: documentación, runtime local para Codex y Claude Code, pruebas reales, autoría y revisión por proveedores distintos y corrección automática acotada de capítulos con informes claros. Autorizada también la primera pantalla de estudio Astro, servidor local, tutoría contextual, ejercicios, notas y reanudación. Autorizada una vista del capítulo para compartir mediante forward, en proceso separado y de solo lectura, sin datos personales ni APIs de tutoría. No desplegar el servicio personal completo a internet. No instalar dependencias innecesarias.
No convertir propuestas pendientes en decisiones confirmadas.
Documentar cambios de alcance y sus motivos.

## Datos y privacidad

Este repositorio es público.
Materiales reales, cursos generados, conversaciones, dictámenes sobre cursos, progreso, bases de datos y respaldos van en almacenamiento local externo al repositorio.
No subir secretos ni datos privados. Usar solo ejemplos ficticios o explícitamente autorizados.
No imprimir claves ni contenidos sensibles.
Las APIs procesan fuera del equipo el contexto enviado: minimizarlo.
Codex usa su sesión predeterminada; Claude usa CLAUDE_CODE_OAUTH_TOKEN de .env. Nunca mostrar tokens ni introducir un fallback a API facturable. Consultar docs/cli-runtime.md.

## Colaboración

OpenAI y Anthropic usan esta misma documentación como referencia.
No asumir memoria compartida, acceso automático a archivos locales ni aprobación del otro modelo.
Nunca atribuir revisión conjunta sin dos revisiones reales registradas.
Seguir docs/chapter-review.md: aprobar solo la versión congelada con dictamen válido del revisor, distinto del autor. Codex autor y Claude revisor por defecto; roles invertibles. Respuestas de prueba y smoke no son aprobación pedagógica.
No reintentar indefinidamente hasta obtener aprobación. Respetar límite de rondas, no inventar fuentes y conservar antes/después. Si falta evidencia, detener para investigarla; no relajar la rúbrica para forzar consenso.
La política de autor/revisor de capítulos y sus límites se describe en la especificación.
Conservar notas, historial y progreso al modificar material. docs/pilots/docker.md forma parte de la huella del alcance aprobado: no actualizar sus notas operativas por limpieza documental; consultar docs/project-status.md para el estado actual.

## Validación y versiones

Para documentación, revisar coherencia, enlaces internos y diferencia entre acuerdos y propuestas.
Para implementación futura, verificar flujos afectados y accesibilidad según el alcance.
No declarar pruebas, revisiones o conformidad que no se hayan realizado.
No crear tags de versión funcional hasta disponer de una versión verificable.
No mover tags publicados. Seguir docs/versioning.md.

## Continuidad documental

Actualizar el estado, la guía del flujo afectado y los contratos cuando cambie el comportamiento. Registrar decisiones nuevas sin confundirlas con propuestas. No asumir que servidores, túneles, sesiones CLI o protecciones remotas sigan activos por haberlo estado antes. No iniciar otra revisión del capítulo aprobado solo para comprobar el estado; validar las huellas y usar los registros conservados.
