# Contrato migrado

## Decision de base de datos

El backend original NestJS ya usaba MongoDB mediante `MONGO_URI`. La migracion Flask mantiene MongoDB con PyMongo y repositorios por recurso. Se descarto SQLite/SQLAlchemy para no cambiar la infraestructura existente.

## Rutas publicas

- `POST /auth/register`
- `POST /auth/login`
- `GET /products`
- `GET /products/top`
- `GET /products/:id`
- `GET /categories`
- `GET /categories/:id`
- `GET /categories/:id/thumbnail`
- `GET /discounts`
- `GET /discounts/:id`
- `GET /reviews`

## Rutas protegidas

- `GET /auth/me`, `POST /auth/logout`, `GET /auth/ws-ticket`
- `GET/PATCH /users/me`
- `POST/PUT/DELETE /reviews/:id` segun owner/admin
- `POST /orders`, `GET /orders/my`, `GET /orders/:id` segun owner/admin
- `POST /files/upload`, `DELETE /files?url=...`

## Rutas admin

- `GET/POST /users`, `GET/PATCH/DELETE /users/:id`
- `POST/PUT/DELETE /products`
- `POST/PUT/DELETE /categories`
- `POST/PUT/DELETE /discounts`
- `GET /orders`, `PUT /orders/:id`

## Compatibilidad JSON

- IDs publicos como `_id: string`.
- Campos camelCase: `displayName`, `avatarUrl`, `createdAt`, `updatedAt`, `categoryId`, `imageUrl`.
- Listados paginados como `{ items, total, page, limit }`.
- Borrados como `{ success: true }`.
- Errores estructurados con `statusCode`, `errors`, `path`, `timestamp`, `requestId`.

## GraphQL

El frontend actual no consume REST directamente para recursos de negocio; usa `POST /graphql`. La implementacion Flask incluye un adaptador para las operaciones detectadas en `frontend/src/backend/apis/*`.

