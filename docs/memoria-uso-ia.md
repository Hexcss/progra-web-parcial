# Memoria de uso de IA - Practica 2

## Herramientas utilizadas

- Codex / ChatGPT como asistente de programacion.

## Prompt 1 - Ejecucion del prompt maestro

### Prompt original

Se pidio ejecutar `PROMPT.md` y usar las skills locales cuando fuera necesario.

### Resultado obtenido

Se audito la estructura real del repo. El prompt hablaba de `apps/api` y Svelte, pero el proyecto usa `backend/api` y un frontend React/TypeScript que consume `/graphql`.

### Correccion aplicada

Se implemento Flask en `backend/api` y se mantuvo compatibilidad REST y GraphQL para no romper el frontend existente.

## Prompt 2 - Cambio de persistencia

### Prompt original

El prompt proponia SQLite con SQLAlchemy.

### Iteracion del usuario

El usuario aclaro que el API anterior ya conectaba a MongoDB y que Python debia seguir usando MongoDB.

### Resultado final aplicado

Se reemplazo la persistencia SQLAlchemy por PyMongo, usando `MONGO_URI` y repositorios por recurso. Los tests usan `mongomock` para no modificar la base real.

## Error o alucinacion detectada

### Que genero la IA

Inicialmente genero una version con SQLAlchemy/SQLite porque eso estaba indicado en el prompt maestro.

### Por que era incorrecto

El proyecto real ya tenia `MONGO_URI`, esquemas Mongoose y una base MongoDB existente. Cambiar a SQLite habria roto la continuidad de datos e infraestructura.

### Como se corrigio

Se cambio `extensions.py`, repositorios, servicios, seed y tests para usar MongoDB/PyMongo. La serializacion sigue exponiendo `_id` como string.

## Analisis critico

La IA se uso para generar estructura por capas y pruebas de contrato, pero las decisiones se ajustaron al contexto real del repositorio: rutas en `backend/api`, frontend GraphQL y MongoDB existente.

