# Piloto: Docker desde cero

Estado: alcance inicial aceptado para iniciar; decisiones operativas pendientes indicadas abajo.
Modalidad: aprendizaje guiado con comprobación de competencias; no asignar dominio por leer.
Contenido académico y dictámenes: almacenamiento local fuera del repositorio.

## Objetivo y límites

Al terminar, empaquetar una aplicación pequeña, ejecutarla con PostgreSQL mediante Compose y diagnosticar problemas básicos de configuración, conexión y persistencia.
No requiere experiencia previa con Docker. Presupone manejo elemental de terminal y archivos; ofrecer nivelación si el diagnóstico detecta dificultades.
La aplicación Node.js y PostgreSQL es un ejercicio propuesto, no una dependencia del producto Understandly.

Fuera de alcance: Kubernetes, Swarm, orquestación avanzada, producción, CI/CD y endurecimiento avanzado. Se podrán mencionar para orientar, sin convertirlos en requisitos.

## Recorrido

| Capítulo | Evidencia esperada |
| --- | --- |
| 1. Modelo mental | Explicar imagen frente a contenedor, contenedor frente a VM y detener frente a eliminar. |
| 2. Operación básica | Ejecutar, detener e inspeccionar un contenedor; interpretar logs y publicación de puertos. |
| 3. Imagen propia | Crear Dockerfile y .dockerignore; explicar reconstrucción y caché básica. |
| 4. Datos y conexiones | Elegir volumen o bind mount y conectar aplicación y base de datos. |
| 5. Compose | Levantar el conjunto, recrear servicios sin perder datos y diagnosticar un fallo provocado. |

Primera entrega: capítulo 1 en borrador. Los demás permanecen planificados, no generados.
No instalar Docker, lanzar contenedores ni modificar servicios existentes al preparar contenido.
Verificar plataforma y disponibilidad de Docker antes de prácticas ejecutables.

## Capítulo 1

Secciones con identificadores estables:
1. Problema: dependencias distintas entre equipos.
2. Imagen y contenedor: diagrama y analogía con límites explícitos.
3. Contenedor y VM: comparación, sin prometer aislamiento absoluto.
4. Detener, iniciar y eliminar: estado del proceso frente a almacenamiento.
5. Ejemplo resuelto y transferencia a otra situación.
6. Reflexión y preguntas abiertas con pistas y feedback.

Criterios propuestos: responder las tres distinciones fundamentales con justificación; reintentar con variantes si hay confusión. Registrar ayuda. Una sesión inicial no demuestra retención.
Revisar más adelante con otro escenario y sin mostrar la respuesta anterior; intervalo pendiente de acordar.

## Aceptación funcional de Understandly usando el piloto

Todos los criterios siguientes están pendientes; no existe implementación.

- Conservar el acuerdo de alcance y su versión.
- Bloquear estado aprobado/publicado si falta uno de los dos dictámenes de la misma versión.
- Mostrar las secciones, un visual y su alternativa textual en desktop y móvil.
- Seleccionar texto o un visual, preguntar y responder conservando contexto y posición.
- Anclar respuesta, cerrar y volver a abrir sin perderla.
- Dar feedback, comparar una reformulación y aplicarla conservando la versión previa.
- Identificar notas cuya ancla quedó obsoleta después de editar.
- Guardar intentos y ayudas sin confundir lectura con competencia.
- Reanudar el progreso después de cerrar y abrir el servicio.
- Mostrar un fallo de API sin perder borradores ni historial.

## Revisión

Dos revisores reales, OpenAI y Anthropic, deben evaluar la misma versión y recursos asociados.
Revisiones iniciales independientes; después resolver diferencias con fuentes.
Autoría o consulta de documentación no cuenta como aprobación.
No se ha contactado a Anthropic ni existe todavía doble aprobación.
No exponer claves; modelos y presupuesto pendientes de configurar.

## Fuentes oficiales de partida

- https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
- https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/
- https://docs.docker.com/engine/storage/
- https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/

## Decisiones operativas pendientes

Equipo para prácticas; modelos y claves configuradas por el usuario; presupuesto; frecuencia de repaso; implementación de interfaz y persistencia.
