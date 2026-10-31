# Hoja de ruta y criterios de cierre

Prioridades propuestas para continuar desde el estado del 31 de octubre de 2026. Los acuerdos de alcance están en [product-spec.md](product-spec.md) y [AGENTS.md](../AGENTS.md). Esta hoja no autoriza por sí sola trabajo nuevo ni despliegues.

## Próxima entrega: cerrar el capítulo 1 con una experiencia real

La base de código existe; el siguiente resultado buscado es comprobar que el usuario puede **abrir → estudiar → preguntar → practicar → guardar → retomar** sin perder contexto ni datos.

| Trabajo | Criterio de aceptación | Estado |
| --- | --- | --- |
| Lectura desktop | Texto y diagrama legibles durante una sesión real; controles comprensibles; sin desplazamiento horizontal de toda la página | Pendiente de prueba visual |
| Lectura móvil | Navegación, paneles y diálogo utilizables; tablas con desplazamiento propio; contenido sin recortes | Pendiente de dispositivo/navegador real |
| Accesibilidad | Recorrido por teclado, foco al abrir/cerrar, Escape, zoom 200 %, reflow a 320 CSS px, contraste y movimiento reducido | Comportamientos implementados parcialmente; verificación manual pendiente |
| Tutor real | Pregunta contextual completada con proveedor disponible, seguimiento en el mismo diálogo y error recuperable | Adaptador e integración simulados; prueba real desde pantalla pendiente |
| Nota anclada | Guardar respuesta, cerrar, recargar y encontrar pregunta, selección y respuesta correctas | Pruebas automatizadas aprobadas; recorrido manual pendiente |
| Ejercicio | Feedback oculto hasta guardar; intento permanece tras recargar; un fallo de guardado no revela solución como si hubiera éxito | Pruebas automatizadas aprobadas; recorrido manual pendiente |
| Reanudación | Volver a la misma sección de la misma versión en otro acceso al servidor | Implementado; prueba manual entre dispositivos pendiente |
| Vista compartida | Mostrar el capítulo por forward al 4322, sin datos personales ni APIs | Integración aprobada; comprobación del túnel real con usuario pendiente |

Registrar defectos concretos con pasos, comportamiento observado y esperado. No sustituir una observación de interfaz por nuevas revisiones del manuscrito aprobado. El dominio del estudiante se verifica mediante evidencias de aprendizaje, no mediante el checklist de la aplicación.

## Después del recorrido manual

### 1. Consolidar una base verificable

- Resolver los defectos de la prueba manual y repetir solo los flujos afectados.
- Revisar estado remoto y preparar una integración única del trabajo acumulado a develop, mediante PR y squash. No abrir un PR por cada punta histórica que ya está contenida en la rama final.
- Resolver la política de sincronización inversa hacia develop sin bypass silencioso.
- Proponer CI con `npm ci`, tests, tipos, build e integración ficticia; sin credenciales de modelos ni materiales del usuario.
- Valorar un tag inicial solo cuando exista una versión funcional verificable y con límites documentados. El nombre v0.1.0 es el objetivo acordado, no un release ya creado.

**Cierre:** revisión y merge según política, comprobaciones reproducibles y notas de versión que distingan lo probado de lo pendiente.

### 2. Separar contenido del acoplamiento al piloto

- Separar alcance académico y anotaciones operativas para evitar que un cambio de documentación invalide contenido aprobado.
- Definir metadata estable de curso, capítulo, sección, actividad, competencias y dependencias; contemplar lecciones independientes.
- Diseñar una migración de ids y anclas que conserve notas e intentos existentes.
- Cambiar rutas fijas por un catálogo validado; no aceptar rutas arbitrarias enviadas por el navegador.
- Definir revocación editorial y versionado de prompt/política de aprobación antes de generalizar la reutilización del historial.

**Cierre:** dos capítulos seleccionables con datos separados, notas antiguas conservadas, rutas verificadas y aprobación ligada al alcance académico correcto. El capítulo 2 no está autorizado a generarse automáticamente por este documento: acordar su producción al llegar a esa tarea.

### 3. Feedback que mejora el material

Hoy «No entiendo el enfoque» produce una aclaración en el diálogo. Falta el flujo de cambio de contenido:

- Elegir fragmento y motivo; solicitar una propuesta de modificación proporcional.
- Mostrar original, propuesta y explicación antes de aplicar.
- Conservar versión previa, notas e intentos; identificar anclas que ya no encajan.
- Invalidar/aplicar revisión editorial de la versión modificada sin inventar aprobación.

**Cierre:** propuesta revisable y reversible que conserva historial; ninguna respuesta del tutor reescribe silenciosamente un capítulo aprobado.

### 4. Seguimiento pedagógico

- Definir evidencia observable por competencia y distinguir intento asistido, desempeño independiente y transferencia.
- Revisar errores con feedback diagnóstico y variantes; no asignar dominio por porcentaje de lectura.
- Definir intervalos y escenarios de retención; acordarlos con el usuario.
- Diseñar agregación sin ocultar competencias esenciales pendientes tras promedios.

**Cierre:** registro explicable de qué se demostró, con qué ayuda y cuándo se volvió a comprobar. No prometer dominio absoluto ni ausencia de olvido.

### 5. Ingesta, generación y rutas amplias

- Aceptar materiales incompletos y objetivos libres; inventariar procedencia y vacíos.
- Acuerdo de alcance previo: competencias, criterios, prerrequisitos, profundidad, exclusiones y modalidad.
- Diseñar generación progresiva y política de desbloqueo independientes del tamaño del programa.
- Añadir carga/análisis de imágenes y OCR después de definir formatos, almacenamiento y capacidad visual del proveedor.
- Implementar biblioteca, programas, cursos, rutas y mapa de conocimientos según el modelo conceptual, sin forzar todos los niveles.

**Cierre:** un nuevo objetivo se convierte en un plan trazable y revisado, sin presentar materiales incompletos como currículo oficial completo.

### 6. Portabilidad y crecimiento

- Exportación/importación y restauración verificables; migraciones de schema.
- Elegir si JSON sigue siendo suficiente o si conviene SQLite. No introducir PostgreSQL solo porque sea parte del ejercicio de Docker.
- Diseñar autenticación y autorización antes de acceso remoto al espacio personal; transporte y proxy explícitos.
- Multiusuario, sincronización y operación con varios procesos requieren decisiones nuevas de aislamiento y persistencia.

**Cierre:** restauración probada, compatibilidad definida y pruebas que impidan acceso entre usuarios. La vista compartida actual no satisface estos requisitos.

## Decisiones pendientes de producto

| Pregunta | Por qué importa |
| --- | --- |
| ¿Qué condiciones desbloquean un capítulo? | Lectura, práctica y evidencia son estados distintos; no aplicar un bloqueo universal |
| ¿Cuánto se genera por adelantado? | Cambia tiempo de espera, costo de revisión y flexibilidad del plan |
| ¿Qué modelos y límites se usan en cada tarea? | Los CLI usan su selección predeterminada; la aplicación no garantiza un modelo concreto |
| ¿Cuándo se comprueba retención? | No puede inferirse de la primera sesión |
| ¿Cómo se reconcilian notas tras reescribir? | La ancla actual no tiene offsets ni reconciliación |
| ¿Qué formatos de entrada se admiten? | OCR/visión y documentos necesitan pipeline y límites específicos |
| ¿Se conserva toda conversación o solo notas ancladas? | Hoy solo se guarda explícitamente la última respuesta anclada |
| ¿Qué significa terminar cada modalidad? | Una conversación filosófica no debe aparecer como examen fallido |

## Fuera de alcance inmediato

No añadir Kubernetes, una plataforma de despliegue público, facturación de APIs, automatizaciones periódicas, rotación de cuentas, un LMS multiusuario ni evaluación universal de respuestas abiertas como consecuencia de «continuar». Elegir una tarea concreta y sus criterios antes de ampliar el sistema.
