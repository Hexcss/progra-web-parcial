# Backend Flask - Practica 2

Backend migrado a Flask manteniendo el contrato principal del frontend actual. Aunque el prompt inicial proponia SQLite, este proyecto ya usaba MongoDB en NestJS, por lo que la version Python mantiene `MONGO_URI` y usa PyMongo desde repositorios.

## Requisitos

- Python 3.11+
- MongoDB accesible mediante `MONGO_URI`
- pip / venv

## Instalacion

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Variables de entorno

```env
FLASK_DEBUG=true
MONGO_URI=mongodb://localhost:27017/portal
MONGO_DB_NAME=portal
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
GCS_BUCKET=neotech-images
RESEND_API_KEY=re_...
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_GOOGLE_REDIRECT_URI=http://localhost:4000/auth/oauth/google/callback
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...
OAUTH_GITHUB_REDIRECT_URI=http://localhost:4000/auth/oauth/github/callback
```

Tambien se acepta `JWT_SECRET_KEY` como alias del access secret.

## Inicializar datos

```bash
python -m app.seed
```

Crea `admin@example.com/admin123`, `user@example.com/user123`, una categoria, un producto y un descuento demo.

## Ejecutar

```bash
python run.py
```

El backend escucha en `http://localhost:4000`.

## Docker

Desde `backend/api`:

```bash
docker compose up --build
```

O desde la raiz del repositorio:

```bash
docker compose up --build api
```

El contenedor expone el puerto `4000` en local. En Cloud Run el servicio usa la variable `PORT` que inyecta la plataforma.

## Cloud Build

El archivo `cloudbuild.yaml` esta preparado para ejecutarse desde `backend/api` o desde la rama subtree `backend/api` que genera el workflow del repositorio.

```bash
gcloud builds submit --config cloudbuild.yaml .
```

Ajusta las substitutions `_MONGO_URI`, `_JWT_ACCESS_SECRET`, `_JWT_REFRESH_SECRET`, `_CORS_ORIGIN`, `_CLIENT_URL`, `_GCS_BUCKET`, `_RESEND_API_KEY`, OAuth y `_RUNTIME_SA` antes de desplegar. Para frontend y API en dominios distintos, el despliegue usa `COOKIE_SAMESITE=None` y `COOKIE_SECURE=true`.

## Contrato

Se mantienen rutas REST principales:

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /auth/ws-ticket`.
- Users: `GET/PATCH /users/me`, CRUD admin en `/users`.
- Products: `GET /products`, `GET /products/top`, `GET /products/:id`, CRUD admin.
- Categories, discounts, reviews, orders y files con los endpoints descritos en `PROMPT.md`.

El frontend real de este repo usa `/graphql`, asi que tambien hay un adaptador GraphQL compatible con las operaciones existentes (`login`, `register`, `products`, `createProduct`, etc.).

## Arquitectura

- `routes.py`: HTTP, request/response.
- `service.py`: reglas de negocio.
- `repository.py`: acceso a MongoDB con PyMongo.
- `schemas.py`: validacion Marshmallow y serializacion JSON.
- `common/errors.py`: errores globales con `{ statusCode, errors, path, timestamp, requestId }`.

## Seguridad

- Passwords con Argon2.
- JWT en cookies HTTP-only `accessToken` y `refreshToken`.
- Roles `user` y `admin`; 401 para no autenticado y 403 para rol insuficiente.
- No se serializa `passwordHash`.

## Integraciones portadas desde NestJS

- OAuth Google y GitHub: `/auth/oauth/google/start`, `/auth/oauth/google/callback`, `/auth/oauth/github/start`, `/auth/oauth/github/callback`.
- Resend: envio de verificacion de email en registro y confirmacion de pedido si `RESEND_API_KEY` esta configurado.
- Google Cloud Storage: uploads GraphQL y REST usan `GCS_BUCKET`/`STORAGE_BUCKET` cuando existe. Si no hay bucket, se usa almacenamiento local en `uploads/` para desarrollo.

En Cloud Run, la service account configurada en `_RUNTIME_SA` debe tener permisos sobre el bucket de GCS.

## Tests

```bash
pytest -q
```

Los tests usan `mongomock://localhost/portal_test`, no la base real.
