# PROMPT.md - Refactorizacion de backend NestJS a Flask para Practica 2

## Rol del asistente de desarrollo

Actua como un senior backend engineer y docente de Programacion Web II. Tu tarea es migrar el backend actual de `apps/api` desde NestJS/Mongoose a un backend nuevo en Python con Flask, manteniendo el frontend Svelte 5 casi sin cambios.

El resultado debe cumplir la Practica 2:

1. Backend en Flask con organizacion modular por capas claras.
2. Autenticacion con JWT compatible con el frontend.
3. Mismos endpoints, metodos HTTP y estructura JSON esperada por el frontend.
4. Validacion estricta de datos con Marshmallow.
5. Manejo global de errores con respuestas HTTP limpias y unificadas.
6. Persistencia real en base de datos, preferiblemente SQLite con SQLAlchemy.
7. Uso de patron repositorio para aislar el acceso a datos.
8. README claro con instalacion y ejecucion.
9. Documento de memoria del uso de IA con prompts, iteraciones, errores detectados y correcciones manuales.

## Contexto del proyecto actual

Repositorio base:

```text
Trabajo-1-PrograWebII-master/
  apps/
    api/  # backend NestJS actual, a reemplazar
    web/  # frontend Svelte 5 que debe seguir funcionando
  packages/
    types/ # tipos compartidos usados por el frontend
```

El frontend consume el backend mediante `apps/web/src/services/*`. No cambies la logica de negocio del frontend salvo que sea imprescindible corregir una URL de entorno. El objetivo principal es que el nuevo Flask respete el contrato existente.

## Stack obligatorio recomendado

Usa Flask, no FastAPI.

Dependencias recomendadas:

```txt
Flask
Flask-Cors
Flask-SQLAlchemy
Flask-JWT-Extended
marshmallow
python-dotenv
argon2-cffi
pytest
pytest-flask
```

Base de datos:

- Usar SQLite para minimizar configuracion.
- Usar SQLAlchemy ORM.
- No usar arrays en memoria, JSON plano ni archivos de texto como persistencia.
- Serializar todos los ids como strings bajo la clave `_id`, aunque internamente sean enteros o UUID.

## Estructura objetivo

Crea o reemplaza `apps/api` con una app Flask asi:

```text
apps/api/
  app/
    __init__.py              # create_app factory
    config.py                # carga de variables de entorno
    extensions.py            # db, jwt, cors
    common/
      errors.py              # excepciones de dominio y manejadores globales
      auth.py                # decorators auth_required, roles_required, current_user
      pagination.py          # helpers page/limit
      security.py            # hash/verify password
      serialization.py       # helpers para _id, dates, decimals
    modules/
      auth/
        routes.py
        service.py
        schemas.py
      users/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
      products/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
      categories/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
      discounts/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
      reviews/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
      orders/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
      files/
        routes.py
        service.py
        schemas.py
      health/
        routes.py
    seed.py
  tests/
    conftest.py
    test_auth.py
    test_products.py
    test_users.py
    test_contract.py
  run.py
  requirements.txt
  README.md
  .env.example
```

## Reglas arquitectonicas no negociables

- No centralices la logica en `run.py` ni en `app/__init__.py`.
- Las rutas solo deben parsear inputs, llamar servicios y devolver JSON.
- Los servicios contienen reglas de negocio.
- Los repositorios encapsulan consultas SQLAlchemy.
- Los modelos SQLAlchemy no deben conocer Flask request/response.
- Los schemas Marshmallow validan entrada y serializan salida.
- Los errores de dominio se lanzan como excepciones propias y se traducen en un manejador global.
- No devuelvas `passwordHash`, `password_hash` ni tokens dentro del JSON de usuario.
- Mantener cookies HTTP-only `accessToken` y `refreshToken` porque el frontend usa `credentials: 'include'`.
- Mantener CORS con credenciales para el origen del frontend.
- Mantener codigos 401 para no autenticado, 403 para rol insuficiente, 404 para recurso inexistente, 409 para conflicto y 422 para validacion.

## Contrato HTTP que debe preservar Flask

### Auth

| Metodo | Ruta | Publica | Respuesta esperada |
|---|---|---:|---|
| POST | `/auth/register` | si | `{ user, verificationEmail }`, set cookies |
| POST | `/auth/login` | si | `{ user }`, set cookies |
| GET | `/auth/me` | no | `{ sub, email, role }` |
| POST | `/auth/logout` | no | `{ success: true }`, clear cookies |
| GET | `/auth/ws-ticket` | no | `{ token }` |
| GET | `/auth/verify-email?token=...` | si | redirect o respuesta compatible |
| GET | `/auth/oauth/google/start` | si | opcional, puede responder 501 si no se implementa OAuth |
| GET | `/auth/oauth/google/callback` | si | opcional, puede responder 501 si no se implementa OAuth |
| GET | `/auth/oauth/github/start` | si | opcional, puede responder 501 si no se implementa OAuth |
| GET | `/auth/oauth/github/callback` | si | opcional, puede responder 501 si no se implementa OAuth |

### Users

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| GET | `/users/me` | user/admin | `SessionUser` o `null` |
| PATCH | `/users/me` | user/admin | `SessionUser` |
| GET | `/users?q=&role=&limit=&page=` | admin | `{ items, total, page, limit }` |
| GET | `/users/:id` | admin | `UserSummary` |
| POST | `/users` | admin | `SessionUser` |
| PATCH | `/users/:id` | admin | `SessionUser` |
| DELETE | `/users/:id` | admin | `{ success: true }` |

### Products

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| GET | `/products?q=&category=&categoryId=&page=&limit=&sort=` | publica | `{ items, total, page, limit }` |
| GET | `/products/top?limit=` | publica | `Product[]` |
| GET | `/products/:id` | publica | `Product` |
| POST | `/products` | admin | `Product` |
| PUT | `/products/:id` | admin | `Product` |
| DELETE | `/products/:id` | admin | `{ success: true }` |

### Categories

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| GET | `/categories` | publica | `CategoryWithStats[]` |
| GET | `/categories/:id` | publica | `CategoryWithStats` |
| GET | `/categories/:id/thumbnail` | user/admin o publica compatible | `{ categoryId, thumbnail }` |
| POST | `/categories` | admin | `CategoryWithStats` o `Category` |
| PUT | `/categories/:id` | admin | `CategoryWithStats` o `Category` |
| DELETE | `/categories/:id` | admin | `{ success: true }` |

### Discounts

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| GET | `/discounts?productId=` | publica | `Discount[]` |
| GET | `/discounts/:id` | publica | `Discount` |
| POST | `/discounts` | admin | `Discount` |
| PUT | `/discounts/:id` | admin | `Discount` |
| DELETE | `/discounts/:id` | admin | `{ success: true }` |

### Reviews

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| GET | `/reviews?productId=&page=&limit=&userId=` | publica | `{ items, total, page, limit }` |
| POST | `/reviews` | user/admin | `Review` |
| PUT | `/reviews/:id` | owner/admin | `Review` |
| DELETE | `/reviews/:id` | owner/admin | `{ success: true }` |

### Orders

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| POST | `/orders` | user/admin | `Order` con `emailStatus` opcional |
| GET | `/orders/my?page=&limit=` | user/admin | `{ items, total, page, limit }` |
| GET | `/orders?page=&limit=` | admin | `{ items, total, page, limit }` |
| GET | `/orders/:id` | owner/admin | `Order` |
| PUT | `/orders/:id` | admin | `Order` |

### Files

| Metodo | Ruta | Rol | Respuesta esperada |
|---|---|---:|---|
| POST | `/files/upload` | user/admin | `{ url, key, filename, size, mimeType }` |
| DELETE | `/files?url=` | user/admin | `{ success: true }` |

Si el alcance de la practica se reduce a productos y usuarios, implementa Auth, Users y Products primero. Luego implementa Categories, Discounts, Reviews y Orders si el frontend los usa en paginas principales. Para endpoints opcionales como OAuth o email, devuelve respuestas controladas o mocks documentados, pero no rompas el arranque.

## Modelos de dominio y campos JSON

### User / SessionUser

```ts
{
  _id: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

Persistir internamente:

- id
- email unico
- password_hash
- role
- display_name
- avatar_url
- refresh_token_hash opcional
- email_verified
- created_at
- updated_at

### Product

```ts
{
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  categoryId?: string;
  tags: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  avgRating?: number | null;
  reviewCount?: number;
  activeDiscount?: {
    discountPercent: number;
    startDate: string;
    endDate: string;
  } | null;
}
```

### Category

```ts
{
  _id: string;
  name: string;
  icon: string;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
  thumbnail?: string | null;
}
```

### Discount

```ts
{
  _id: string;
  productId: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Review

```ts
{
  _id: string;
  productId: string;
  userId: string;
  score: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    _id?: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
  };
}
```

### Order

```ts
{
  _id: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    imageUrl?: string;
    unitPrice: number;
    quantity: number;
    discountPercent?: number;
    lineTotal: number;
  }>;
  subtotal: number;
  total: number;
  status?: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'canceled' | string;
  currency?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  emailStatus?: {
    attempted: boolean;
    sent: boolean;
    id?: string | null;
    error?: string | null;
  };
}
```

## Formato de error obligatorio

Devuelve errores con estructura compatible con el frontend:

```json
{
  "statusCode": 422,
  "errors": ["price must be greater than or equal to 0"],
  "path": "/products",
  "timestamp": "2026-05-27T12:00:00Z",
  "requestId": "..."
}
```

Reglas:

- 401 si no hay JWT valido.
- 403 si el usuario esta autenticado pero no tiene rol suficiente.
- 404 si no existe el recurso.
- 409 si hay duplicado o conflicto, por ejemplo email repetido o review duplicada.
- 422 si Marshmallow rechaza el body.
- 500 solo para errores no esperados.

## Autenticacion y cookies

El NestJS actual usa cookies `accessToken` y `refreshToken` HTTP-only. El frontend usa `fetch(..., { credentials: 'include' })`, asi que Flask debe hacer lo mismo.

Implementar:

- `POST /auth/register`: crea usuario, hashea password, crea tokens, setea cookies, responde `{ user, verificationEmail }`.
- `POST /auth/login`: verifica password, crea tokens, setea cookies, responde `{ user }`.
- `GET /auth/me`: lee access token de cookie y responde `{ sub, email, role }`.
- `POST /auth/logout`: limpia cookies y responde `{ success: true }`.
- Si access token expira pero existe refresh token valido, emitir cookies nuevas en middleware/decorator o en endpoint protegido.

Cookie options:

```python
httponly=True
samesite="Lax"
secure=config.COOKIE_SECURE
path="/"
```

En local, `secure=False`. En produccion con HTTPS, `secure=True`.

## Plan de implementacion incremental

Trabaja en pasos pequenos y verificables:

1. Crear app Flask con app factory, CORS, SQLAlchemy, JWT, errores globales y health check.
2. Implementar modelos base, migracion inicial o `db.create_all()` para practica.
3. Implementar Users y Auth con cookies JWT.
4. Implementar Products con queries, paginacion, roles y validacion.
5. Implementar Categories, Reviews, Discounts y Orders si el frontend los usa.
6. Implementar Files con almacenamiento local simple en `uploads/` o mock documentado si no es central.
7. Crear seed de usuario admin y productos de prueba.
8. Crear tests de contrato sobre endpoints principales.
9. Actualizar README con instalacion, variables, seed y ejecucion.
10. Crear memoria de IA con prompts reales, iteraciones y analisis critico.

## Criterios de aceptacion antes de terminar

- `flask --app run.py run` o `python run.py` arranca sin errores.
- CORS permite el origen del frontend con credenciales.
- `POST /auth/register` y `POST /auth/login` setean cookies.
- `GET /users/me` funciona con cookies.
- Admin puede CRUD de usuarios y productos.
- Usuario normal no puede crear, editar ni borrar productos.
- `GET /products` responde `{ items, total, page, limit }`.
- Validaciones invalidas devuelven 422 estructurado.
- Errores de rol devuelven 403 estructurado.
- No existe logica de negocio en rutas.
- No se exponen passwords ni hashes.
- README permite ejecutar el backend desde cero.
- Hay documento de uso de IA con prompts, iteraciones, error/alucinacion y correccion.

## Instrucciones para el asistente/coding agent

Cuando generes codigo:

- Haz primero un inventario del contrato actual leyendo controladores NestJS y servicios del frontend.
- No adivines rutas si puedes leerlas.
- Preserva nombres JSON camelCase y `_id`.
- Internamente puedes usar snake_case, pero serializa a camelCase.
- Si introduces una decision de diseno, explicala en un comentario corto o en README.
- Evita implementar OAuth completo salvo que sea necesario. Si no se implementa, documentalo como fuera de alcance o endpoint no esencial.
- Prioriza lo evaluado por la practica: Users, Products, Auth, arquitectura, validacion, errores, base de datos real y documentacion de IA.
- Despues de cada modulo, anade o actualiza tests.

## Prompt de ejecucion recomendado

Usa este prompt con el agente de codigo dentro del repositorio:

```text
Analiza el backend NestJS actual en apps/api y el frontend Svelte 5 en apps/web/src/services. Migra apps/api a un backend Flask con SQLAlchemy, Marshmallow y JWT, manteniendo los mismos endpoints, metodos HTTP y JSON que consume el frontend. Sigue la estructura por capas controller/routes, service, repository, model y schemas. Usa SQLite real, no memoria ni JSON plano. Preserva cookies HTTP-only accessToken y refreshToken para autenticacion porque el frontend usa credentials include. Implementa roles user/admin con 401 y 403 correctos. Implementa errores globales con formato { statusCode, errors, path, timestamp, requestId }. Implementa primero Auth, Users y Products; despues Categories, Discounts, Reviews, Orders y Files segun el consumo del frontend. No expongas hashes de password. Crea README, .env.example, seed de admin y tests de contrato. Documenta decisiones y cualquier endpoint opcional no implementado.
```
