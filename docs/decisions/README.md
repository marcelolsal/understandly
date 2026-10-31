# Registro de decisiones

Decisiones consolidadas de la conversación y del código. Las fechas indican la etapa en que se adoptaron o consolidaron, no una norma externa. Las propuestas abiertas están en [la hoja de ruta](../roadmap.md).

## D01 · Aprendizaje con competencias delimitadas

**Estado:** vigente. **Etapa:** definición inicial, octubre de 2026.

El sistema permite estudiar desde una duda puntual hasta programas amplios. Debe definir alcance, profundidad, exclusiones, competencias, criterios, prerrequisitos y fuentes antes de producir contenido. Se separan recorrido, competencia demostrada y retención; no se promete 100 % de dominio ni olvido cero.
Consecuencia: leer, guardar un intento o recibir una aprobación editorial no acredita competencia. Las modalidades de conversación o lectura pueden existir sin examen.
Fundamentos y referencias: [especificación, secciones 2–5 y 10](../product-spec.md).

## D02 · Estructura modular y no jerarquía obligatoria de títulos

**Estado:** vigente en el modelo conceptual; implementación general pendiente.

Colección, programa, curso, capítulo, lección y actividad son niveles opcionales. Temas y competencias se relacionan con contenido y prerrequisitos, no son contenedores rígidos. Técnico, grado o maestría son tipos/referencias de programa, no niveles que todo usuario deba recorrer. Se pueden tener charlas sin evaluación.
Consecuencia: no diseñar un catálogo que obligue a crear un grado para explicar un tema. El piloto actual no implementa todavía ese catálogo.

## D03 · Astro, React y controles para lectura prolongada

**Estado:** vigente e implementado como primer lector.

Se eligió Astro con patrones de shadcn/ui, React para las interacciones y reglas de diseño propias. El texto usa preferencias de tema, tamaño, ancho y fuente; no se impone modo oscuro ni se promete que una paleta reduzca la fatiga.
Consecuencia: CSS y comportamiento deben probarse con el usuario en sesiones reales, desktop y móvil. Radix ayuda con diálogos, pero no certifica la accesibilidad de la aplicación.

## D04 · Materiales y progreso fuera del repositorio

**Estado:** vigente.

El código y las reglas compartidas viven en GitHub; materiales, cursos generados, notas, conversaciones, dictámenes, intentos y respaldos son privados y locales. .env no se versiona.
Consecuencia: el clon no contiene un curso listo para abrir. La instalación necesita preparar el directorio privado. Los ejemplos y pruebas dentro del repo son ficticios. La vista compartida es una divulgación deliberada del capítulo seleccionado, no de todo ese directorio.

## D05 · CLI oficiales en vez de API facturable

**Estado:** vigente; sustituye la propuesta inicial de API directa. **Etapa:** runtime inicial, 28 de octubre de 2026.

Por costo de usar dos APIs, se implementaron adaptadores de procesos oficiales. Codex conserva la sesión/configuración predeterminadas del usuario. Claude recibe `CLAUDE_CODE_OAUTH_TOKEN`, procedente del flujo oficial de token de suscripción. No hay extracción de credenciales internas, selección automática de cuentas ni fallback de API.
Consecuencia: se depende de la instalación, autenticación, cuota y contrato de salida de los CLI. Las peticiones siguen enviándose a proveedores remotos. No sustituir un error de permisos del entorno del agente por un diagnóstico de credenciales inválidas.
Detalle operativo: [runtime](../cli-runtime.md).

## D06 · Autor y revisor, con cierre editorial

**Estado:** vigente; sustituye la doble revisión obligatoria inicial. **Etapa:** 28 de octubre de 2026.

El requisito original pedía dos dictámenes independientes de aprobación sobre la misma versión. Tras demasiadas rondas y tiempo, el usuario cambió a un autor que define/corrige y otro proveedor que revisa/solicita cambios. Por defecto: Codex autor y Claude revisor; se puede invertir. La aprobación histórica doble de la revisión 5 se conserva como tal.
Consecuencia: no se atribuye una segunda aprobación por haber redactado. Sugerencias opcionales no bloquean. Se mantienen criterios, evidencia y huellas; no se relaja la rúbrica para obtener un sí.

## D07 · Corrección acotada y reutilización de aprobación

**Estado:** vigente e implementado.

Las correcciones conservan antes/después, razones y observaciones atendidas. Por defecto hay tres rondas, como máximo diez si se configura. Falta de evidencia, errores de proveedor, entradas cambiadas o falta de progreso detienen el ciclo. La última ronda no escribe una versión que no pueda revisarse.
Repetir auto con mismas entradas y roles reutiliza una aprobación validada. Una nueva ejecución ya no consulta al modelo solo porque el usuario vuelva a lanzar el comando. `--force-review` permite pedir otra revisión expresamente.
Consecuencia: no hay loop hasta conseguir aprobación, retries ciegos ni invención de fuentes. «Ya aprobado» debe ser un estado de cierre visible. Ver [contrato de revisión](../chapter-review.md) para límites actuales del historial.

## D08 · Piloto Docker y almacenamiento simple

**Estado:** vigente como alcance inicial, no como arquitectura permanente.

Se eligió Docker desde cero para verificar una experiencia completa con un capítulo. El curso tiene cinco capítulos planificados; solo el primero está preparado. El producto actual usa rutas fijas y JSON schema 1 con escrituras atómicas serializadas por proceso.
Consecuencia: no se ha adoptado SQLite, MDX ni un sistema de catálogo. Node/PostgreSQL/Compose forman parte del ejercicio final propuesto para aprender Docker, no son dependencias del almacenamiento de Understandly.

## D09 · Preguntar y pedir otro enfoque son acciones distintas

**Estado:** parcialmente implementado.

El usuario puede seleccionar un fragmento y resolver una duda en un diálogo, seguir la conversación y anclar una respuesta. Pedir otro enfoque expresa feedback sobre la explicación y puede producir una reformulación.
Consecuencia: la primera implementación da esa reformulación en el diálogo. El flujo de comparar/aplicar cambios al manuscrito conservando versiones está pendiente; no se debe presentar la respuesta alternativa como contenido aplicado.
El análisis de capturas o imágenes arbitrarias también está pendiente; el diagrama se consulta como texto estructural.

## D10 · Servicio personal y vista de compartir en procesos separados

**Estado:** vigente e implementado. **Etapa:** problema de forward, 28 de octubre de 2026.

El servicio personal, por defecto 4321, sigue restringido a host local/IP privada y sin proxy. Para mostrar la página, `npm run share` crea otro proceso, por defecto 4322, que acepta la lectura mediante forward pero no carga datos personales ni habilita APIs.
Consecuencia: el túnel puede reescribir Host a localhost sin recuperar permisos. Los endpoints también aplican el bloqueo. Se comparte el capítulo, incluidos los datos de sus soluciones; no es autenticación ni acceso remoto completo. No quitar las restricciones de 4321 para resolver un forward.

## D11 · Gitflow, PR y tags

**Estado:** acordado; protección remota verificada históricamente, excepción inversa pendiente.

main, staging y develop requieren PR, sin push directo, bypass, force push ni borrado. Trabajo hacia develop con squash; promociones entre ramas permanentes con merge commit. Los tags siguen `vMAJOR.MINOR.PATCH` y no se mueven; v0.1.0 será el primer piloto funcional verificado.
Consecuencia: no crear un tag solo por terminar documentación. Las ramas actuales de trabajo están apiladas; consolidar la entrega evita integrar dos veces el mismo trabajo. El ruleset que limita develop a squash no resuelve todavía los merges inversos desde staging/main.
Detalle: [versionado](../versioning.md) y [operaciones GitHub](../../ops/github/README.md).

## D12 · Documentación compartida y alcance congelado

**Estado:** vigente. **Consolidación:** 31 de octubre de 2026.

AGENTS.md y la documentación del repositorio deben bastar para continuar desde Codex o Claude sin suponer memoria compartida. El estado operativo se concentra en project-status.md; las decisiones vigentes se distinguen de propuestas y estados históricos.
El archivo de alcance Docker está ligado a la aprobación por SHA-256 y conserva anotaciones antiguas. No se reescribe por motivos de limpieza documental. Se explica esa condición en el índice y se propone separar responsabilidades en una futura migración.
Consecuencia: esta entrega no modifica el manuscrito, las evidencias, los dictámenes ni el alcance congelado y no inicia una nueva revisión académica.
