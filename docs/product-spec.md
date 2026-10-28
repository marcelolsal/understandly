# Especificación de Understandly

Estado: base conceptual acordada con el usuario. La implementación todavía no está autorizada.
Las propuestas y decisiones pendientes se identifican por separado. Este documento es la referencia compartida entre asistentes.

## 1. Propósito

Permitir aprender desde una duda puntual hasta una materia o un programa completo, mediante lectura, recursos visuales, ejemplos, conversación, práctica y seguimiento.
Conservar materiales, notas, preguntas, intentos y revisiones de manera exportable.
No prometer dominio absoluto ni ausencia de olvido: demostrar competencias delimitadas, transferencia y retención cuando corresponda.

## 2. Entradas y definición inicial

Aceptar tanto objetivos sin materiales como documentos, clases, capturas y ejercicios resueltos incompletos.
El agente analiza cobertura, nivel, fuentes, contradicciones y vacíos; distingue contenido explícito de inferencias.
Antes de generar el curso, acuerda con el usuario:
- Propósito y contexto de uso.
- Alcance, profundidad y exclusiones justificadas.
- Competencias y criterios observables de logro.
- Prerrequisitos y nivelación.
- Fuentes originales y complementarias, incertidumbres y verificaciones pendientes.
- Modalidad, evaluación y retención, cuando procedan.

El alcance se versiona. Cambios importantes explican consecuencias y se acuerdan con el usuario.
No presentar una reconstrucción desde materiales incompletos como cobertura del currículo oficial sin evidencia.

## 3. Organización modular

| Elemento | Función |
| --- | --- |
| Colección | Organización personal de intereses o varios programas. |
| Programa | Plan amplio con objetivo global y varios cursos. |
| Curso o asignatura | Recorrido coherente delimitado. |
| Módulo, unidad o capítulo | Bloque con propósito concreto. Son nombres de un mismo nivel inicial. |
| Lección o sesión | Experiencia concreta dividida en secciones. |
| Actividad o recurso | Lectura, imagen, ejemplo, ejercicio o simulación. |

Los niveles son opcionales: una sesión puede existir sola y un curso puede omitir módulos.
Años, ciclos y semestres pueden agrupar cursos cuando sea útil.
Técnico, licenciatura o maestría son tipos o referencias de programa, no una cadena obligatoria de contenedores.
Un plan personal no acredita por sí mismo una titulación.
Una ruta ordena elementos reutilizables para un objetivo sin duplicarlos.

Temas y competencias son entidades relacionadas con contenidos, no niveles rígidos.
Distinguir pertenencia, prerrequisito y relación temática.
Reconocer aprendizajes previos según profundidad y evidencia, no solo por coincidencia del nombre del tema.

## 4. Modalidades

- Lectura o exposición: explicación y consultas opcionales.
- Conversación o exploración: perspectivas, reflexión y preguntas abiertas; sin nota obligatoria.
- Aprendizaje guiado: práctica y ayudas sin examen obligatorio.
- Dominio evaluado: competencias, evidencias, criterios y repasos.

La modalidad es independiente del tamaño del contenido y puede variar dentro del curso.
En filosofía se puede revisar argumentación cuando se solicita; no calificar convicciones como correctas o incorrectas.
Las charlas no deben aparecer como cero por ciento de dominio: mostrar sin evaluación.

## 5. Fundamentos pedagógicos

Aplicar con criterio, sin presentar marcos, evidencia y normas técnicas como equivalentes:
- CAST UDL: distintas formas de participación, representación y expresión; feedback orientado a actuar.
- IES: ejemplos resueltos alternados con problemas, representaciones visuales con explicación, conexión concreto-abstracto, recuperación y estudio distribuido.
- Evaluación formativa: identificar dificultades, explicar errores y permitir actuar sobre el feedback.
- Aprendizaje para el dominio: apoyo adicional y criterios explícitos; su evidencia tiene límites y no justifica promesas universales.
- WCAG 2.2 AA como objetivo de accesibilidad, pendiente de verificación en implementación.

Los visuales deben explicar relaciones o procesos; evitar decoraciones que distraigan.
Pistas progresivas, nuevos intentos y dificultad gradual. Diferenciar práctica de evaluación.
En respuestas verificables usar validación determinista cuando sea apropiado.
En respuestas abiertas usar rúbricas, fuentes y posibilidad de cuestionar el dictamen.

## 6. Material preparado y generación

Las lecciones contienen secciones de explicación, visuales pertinentes, ejemplos y actividades según modalidad.
Propuesta pendiente de cerrar: planificar el recorrido completo, generar un primer capítulo completo y preparar los siguientes progresivamente.
Generación y desbloqueo son estados independientes.
Un capítulo preparado puede estar bloqueado; uno planificado puede estar pendiente de generación.
Las restricciones de avance dependen del acuerdo del curso y no se aplican universalmente.

## 7. Revisión por dos proveedores

Requisito del usuario: OpenAI y Anthropic deben aprobar la misma versión antes de publicarla como capítulo aprobado.
No simular un segundo revisor ni atribuir aprobaciones no realizadas.
El acuerdo entre modelos no garantiza exactitud: exige fuentes y criterios.

Flujo:
1. Definición acordada con el usuario.
2. Preparación con fuentes, explicaciones, visuales y actividades.
3. Primera revisión independiente de ambos sin ver el dictamen del otro.
4. Contraste de observaciones, corrección y resolución documentada de objeciones.
5. Aprobación explícita de ambos sobre la versión final.

Rúbrica: exactitud y fuentes; alcance; secuencia y prerrequisitos; explicaciones y visuales; práctica y feedback; evaluación adecuada a modalidad; presentación y accesibilidad.
Registrar proveedor, modelo, versión o identificador disponible, contenido revisado, dictamen, motivos y correcciones.
Los cambios sustanciales requieren nueva revisión de la parte afectada y sus dependencias.
Un desacuerdo o indisponibilidad deja pendiente la aprobación, sin inventar consenso.
Limitar rondas y costos; valores pendientes de definir.
Distinguir desacuerdo sobre preferencias (usuario) de desacuerdo factual (evidencia).
La doble revisión de cada respuesta del tutor en vivo NO está acordada: resolver latencia y costo primero.
El feedback del estudiante puede reabrir contenido aprobado.

## 8. Consultas contextuales

Seleccionar texto o imagen habilita Preguntar sobre esto.
Ventana con selección visible, pregunta, respuesta y seguimiento en el mismo contexto.
Enviar objetivo, sección y antecedentes pertinentes; evitar transmitir todo el archivo por defecto.
El análisis de imágenes requiere capacidad visual y contexto adecuado.
Respuestas puntuales, ampliables, con referencias a temas previos o futuros.
Una referencia futura puede mostrar descripción y motivo aun si su destino está bloqueado.

Permitir anclar respuestas como notas vinculadas al fragmento o imagen y recuperar la conversación.
Conservar posición de lectura al cerrar.
En móvil adaptar a un panel suficientemente amplio y utilizable.
Las notas sobreviven a revisiones; si se pierde su ancla, identificar su versión de origen sin reasignarlas silenciosamente.

## 9. Feedback que modifica el material

Mejorar esta explicación es una acción distinta de consultar.
El usuario identifica falta de pasos, vocabulario desconocido, ejemplo confuso o necesidad de otro enfoque.
Proponer cambio proporcional: definición, paso intermedio, ejemplo alternativo, revisión visual o reescritura.
Mostrar propuesta antes de aplicar; conservar original e historial.
Revisar dependencias y estado de aprobación cuando cambie el contenido.
Una aclaración guardada puede convertirse en propuesta para la lección.

## 10. Seguimiento y navegación

Separar:
- Contenido recorrido.
- Competencias demostradas y ayuda utilizada.
- Retención comprobada después de un intervalo.

Un acierto con pistas no equivale a desempeño independiente.
No inferir retención por simple lectura o ausencia de errores.
No ocultar competencias esenciales pendientes tras un promedio.
Definir agregación de obligatorios, optativos y modalidades sin evaluación.

Vistas previstas: biblioteca; plan desplegable; mapa de conocimientos.
En móvil priorizar navegación desplegable.
Conversaciones exploratorias muestran notas, preguntas y estado elegido, sin porcentaje de dominio obligatorio.
Frecuencia de repasos y reglas de agregación pendientes de definir.

## 11. Diseño para lectura prolongada

Base acordada: Astro + shadcn/ui con reglas visuales propias.
Preferencias ajustables y persistentes, con variación por dispositivo.
Modo lectura con controles secundarios ocultables.
Texto seleccionable, diagramas ampliables, notas discretas y consultas que no pierdan la ubicación.
Temas claro, oscuro y cálido con contraste verificado; oscuro no se impone como solución universal.
Movimiento discreto y respeto a movimiento reducido.

Propuestas iniciales para validar con el usuario:
- Texto de lectura alrededor de 18–20 px, independiente de controles.
- Ancho aproximado de 60–75 caracteres en escritorio.
- Interlineado de 1,6–1,8.
- Fuente de sistema con posible alternativa serif.

No prometer reducción de fatiga por una biblioteca o paleta.
Verificar teclado, foco, zoom, reflow, contraste, espaciado y selección accesible sin depender solo del ratón.
Probar una lección con lectura larga, visuales, consulta y nota en desktop y móvil antes de cerrar apariencia.

## 12. Arquitectura y datos

Acordado:
- Acceso inicial en red local; preparado para acceso remoto posterior.
- Tutor integrado mediante API; soporte previsto para OpenAI y Anthropic.
- Claves solo en servidor.
- Datos personales y académicos locales externos al repositorio.
- Código y reglas compartidas en GitHub.
- Exportación, respaldo y portabilidad.
- Lectura y actividades sin IA disponibles cuando la API falle, según recursos almacenados.

Propuestas pendientes de validar: React para interacciones, Markdown/MDX con metadatos para contenido, SQLite para persistencia.
Definir directorio de datos configurable; evitar rutas absolutas del equipo.
Almacenamiento local no significa procesamiento local: explicitar qué se envía a APIs.
El repositorio público no concede a asistentes acceso a materiales privados.
Antes de acceso externo, configurar autenticación, protección del transporte y acceso seguro.
Si el servidor está en casa, requiere equipo encendido y conectividad para acceso remoto.
No exponer el servicio a internet como parte de esta fase.

## 13. Piloto propuesto

Tema elegido: Docker desde cero. Alcance y criterios iniciales en [Piloto Docker](pilots/docker.md). Material generado permanece fuera del repositorio.
Recorrer: ingesta incompleta, alcance acordado, capítulo preparado, doble revisión, estudio, selección de texto e imagen, consulta, nota anclada, reformulación, actividad con feedback y reanudación del progreso.
Comprobar comodidad en desktop y móvil y separación de recorrido, competencia y retención.
No declarar exitoso el piloto antes de verificarlo con el usuario.

## 14. Decisiones abiertas

- Materiales adicionales, plataforma de prácticas y detalles operativos del piloto Docker.
- Modelos concretos, límites de gasto, rondas de revisión y tratamiento de fallos.
- Generación anticipada o progresiva y reglas de desbloqueo por curso.
- Formatos admitidos, OCR y tratamiento de imágenes.
- Persistencia, sincronización entre dispositivos, exportación y restauración.
- Rúbricas operativas y criterios de aceptación del piloto.
- Frecuencia de repaso y agregación de progreso.
- Mecanismo futuro de acceso remoto.
- Implementación e interoperabilidad efectiva con estándares.

No declarar conformidad con CASE, Common Cartridge u otros estándares sin implementarla y verificarla.
No instalar dependencias ni desarrollar la aplicación hasta nueva instrucción del usuario.

## 15. Referencias

- CAST UDL: https://udlguidelines.cast.org/
- IES, Organizing Instruction and Study to Improve Student Learning: https://ies.ed.gov/ncee/wwc/PracticeGuide/1
- EEF, Mastery learning: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/mastery-learning/
- EEF, Feedback: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- UNESCO ISCED: https://www.uis.unesco.org/en/methods-and-tools/isced
- Cedefop, Unit of learning outcomes: https://www.cedefop.europa.eu/en/tools/vet-glossary/glossary/eenheid-van-leerresultaten
- CASE: https://standards.1edtech.org/case/
- Common Cartridge (referencia futura de intercambio): https://www.1edtech.org/standards/cc
- Astro: https://docs.astro.build/en/concepts/islands/
- shadcn/ui Astro: https://ui.shadcn.com/docs/installation/astro

Estos marcos fundamentan decisiones distintas; la estructura del producto es una adaptación propia, no una jerarquía prescrita por ellos.
