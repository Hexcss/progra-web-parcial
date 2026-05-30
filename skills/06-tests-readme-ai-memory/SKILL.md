---
name: practica2-tests-readme-ai-memory
description: Preparar tests, README y memoria del uso de IA para la entrega de Practica 2.
---

# SKILL.md - Tests, README y memoria IA

## Objetivo

Asegurar que la entrega no solo funciona, sino que tambien cumple los apartados documentales de la practica.

La practica pide:

- Repositorio publico con instrucciones claras de instalacion y ejecucion.
- Documento anexo con memoria del uso de Inteligencia Artificial.
- Indicar que partes del backend se estan utilizando, endpoints principales y roles necesarios.
- Documentacion subida al Campus.

## Tests minimos recomendados

Usar pytest.

### Auth

- `POST /auth/register` con body valido devuelve 201 o 200, setea cookies y devuelve `{ user, verificationEmail }`.
- `POST /auth/login` con credenciales validas devuelve `{ user }` y setea cookies.
- Login con password incorrecto devuelve 401.
- `GET /auth/me` sin cookie devuelve 401.
- `GET /auth/me` con cookie devuelve `{ sub, email, role }`.

### Users

- Usuario autenticado puede consultar `/users/me`.
- Admin puede listar usuarios.
- Usuario normal no puede listar usuarios: 403.
- Admin puede crear usuario.
- Email duplicado devuelve 409.

### Products

- `GET /products` publico devuelve `{ items, total, page, limit }`.
- `POST /products` sin login devuelve 401.
- `POST /products` con user normal devuelve 403.
- `POST /products` con admin crea producto.
- Producto con `price < 0` devuelve 422.
- `DELETE /products/:id` admin devuelve `{ success: true }`.

### Validation/errors

- JSON invalido o body invalido devuelve formato estructurado.
- 404 devuelve formato estructurado.

## README obligatorio

El README de `apps/api` debe contener:

```md
# Backend Flask - Practica 2

## Requisitos
- Python 3.11+
- pip / venv

## Instalacion
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

## Variables de entorno
FLASK_ENV=development
DATABASE_URL=sqlite:///app.db
JWT_SECRET_KEY=...
JWT_REFRESH_SECRET_KEY=...
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false

## Inicializar base de datos
python -m app.seed

## Ejecutar
python run.py

## Endpoints principales y roles
...

## Arquitectura
Explicacion breve de routes/services/repositories/models/schemas.

## Validacion y errores
Explicacion del formato de error.

## Decisiones de migracion
Que se preservo del backend NestJS y que se simplifico.
```

## Memoria de uso de IA

Crea un archivo, por ejemplo:

```text
docs/memoria-uso-ia.md
```

Estructura recomendada:

```md
# Memoria de uso de IA - Practica 2

## Herramientas utilizadas
- ChatGPT / Copilot / Gemini / etc.

## Prompt 1 - Auditoria del backend NestJS

### Prompt original
...

### Resultado obtenido
...

### Problema detectado
...

### Iteracion/refinamiento
...

### Resultado final aplicado
...

## Prompt 2 - Estructura Flask por capas
...

## Prompt 3 - JWT y cookies
...

## Error o alucinacion detectada

### Que genero la IA
Ejemplo: genero JWT en localStorage o devolvio tokens en JSON, pero el frontend usaba cookies HTTP-only.

### Por que era incorrecto
Rompia el contrato del frontend y reducia la seguridad.

### Como se corrigio manualmente
Se implementaron cookies HTTP-only `accessToken` y `refreshToken`, CORS con credenciales, y decorators de roles.

## Analisis critico
Explicar como se verifico el codigo generado, que se acepto, que se descarto y que conceptos de clase se aplicaron.
```

## Ejemplos de errores/alucinaciones utiles para documentar

Puedes documentar uno real si aparece durante el desarrollo. Ejemplos plausibles a vigilar:

1. La IA propone guardar datos en listas en memoria. Incorrecto porque la practica exige base de datos real.
2. La IA cambia `_id` por `id`. Incorrecto porque rompe el frontend.
3. La IA mete queries SQLAlchemy en routes. Incorrecto porque rompe la separacion de capas.
4. La IA devuelve JWT en JSON/localStorage. Incorrecto porque el frontend usa cookies HTTP-only.
5. La IA no implementa 403 y devuelve 401 para todo. Incorrecto porque roles y autenticacion son casos distintos.
6. La IA usa validaciones manuales incompletas en lugar de Marshmallow. Suboptimo para validacion estricta.

## Checklist final de entrega

- [ ] Codigo en repositorio publico.
- [ ] Backend Flask arranca localmente.
- [ ] README completo.
- [ ] `.env.example` incluido.
- [ ] Base de datos real SQLite.
- [ ] Repositorios usados.
- [ ] JWT y roles funcionando.
- [ ] Validaciones 422 funcionando.
- [ ] Errores globales funcionando.
- [ ] Memoria IA incluida.
- [ ] Endpoints y roles documentados.
- [ ] Campus incluye documentacion requerida.
