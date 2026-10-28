# Configuración inicial pendiente de aplicar

Los JSON son propuestas preparadas, no reglas publicadas ni verificadas en GitHub.
El usuario decidió inicializar el repositorio en local y posponer la conexión al remoto. No hay protecciones remotas aplicadas. Las comprobaciones anteriores de gh no fueron concluyentes por problemas de conectividad.

## Flujo principal solicitado

- Ramas de trabajo -> develop: PR con squash.
- develop -> staging -> main: PR con merge commit.
- PR obligatorio en las tres ramas, sin bypass configurado, sin force push y sin borrado.
- No exigir historial lineal en staging/main: impediría los merge commits solicitados.
- Cero aprobaciones humanas obligatorias inicialmente para no bloquear a un propietario único; exigir PR no equivale a exigir otro revisor.
- Mantener habilitados merge y squash en ajustes generales; deshabilitar rebase.
- No crear tags de aplicación todavía.

## Limitación por resolver

Los métodos de merge de estos rulesets se seleccionan por rama destino. El ruleset de develop permite solo squash, por lo que NO resuelve la excepción de merge normal para PR desde staging o main hacia develop. No presentar esta configuración como cumplimiento completo de movimientos entre las tres ramas.
Si se requieren esas sincronizaciones inversas, acordar una política de merge controlado que compruebe origen y destino. No habilitar un bypass silencioso.
Los rulesets tampoco restringen por sí solos la rama origen de una promoción.

## Aplicación cuando exista acceso

1. Revisar de nuevo el estado remoto y no sobrescribir cambios ajenos.
2. Publicar las ramas locales main, staging y develop con su historia común, si el remoto sigue vacío. Si ya tiene commits, revisar su integración antes de publicar.
3. Conservar el commit inicial local como punto de arranque compartido; no recrearlo en GitHub.
4. Configurar métodos generales y aplicar rulesets, tras resolver la excepción indicada.
5. Leer nuevamente ramas, ajustes y reglas para verificar el resultado.
6. Incorporar los cambios posteriores en ramas de trabajo mediante PR a develop.

Referencia: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
