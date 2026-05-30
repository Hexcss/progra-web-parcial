---
name: practica2-contract-audit
description: Auditar el contrato HTTP del backend NestJS y el consumo del frontend Svelte antes de migrar a Flask.
---

# SKILL.md - Auditoria de contrato NestJS/Svelte

## Objetivo

Usa esta skill antes de escribir Flask. Su funcion es evitar romper el frontend al migrar el backend.

La practica exige que el backend nuevo exponga los mismos endpoints, URLs, metodos HTTP y estructuras JSON esperadas por la aplicacion Svelte 5.

## Archivos fuente a revisar

Revisa primero:

```text
apps/api/src/modules/**/**.controller.ts
apps/api/src/modules/**/dto/*.ts
apps/api/src/modules/**/entities/*.ts
apps/api/src/modules/**/**.service.ts
apps/web/src/services/*.ts
packages/types/src/*.ts
```

## Procedimiento

1. Extrae todos los endpoints desde los controladores NestJS.
2. Cruza esos endpoints con los servicios del frontend Svelte.
3. Identifica que rutas son realmente usadas por el frontend.
4. Extrae los DTO de entrada desde `dto/*.ts`.
5. Extrae los tipos de respuesta esperados desde `packages/types/src/*.ts`.
6. Construye una tabla con metodo, ruta, rol, request body, query params y response.
7. Marca como "critico" todo endpoint que aparezca en `apps/web/src/services`.
8. Marca como "opcional" OAuth, email y features que no sean centrales para la practica si no aparecen en la UI principal.

## Endpoints criticos detectados

### Auth

```text
POST /auth/login
POST /auth/register
GET  /users/me
GET  /auth/me
POST /auth/logout
```

### Users

```text
GET    /users
POST   /users
PATCH  /users/:id
DELETE /users/:id
PATCH  /users/me
```

### Products

```text
GET    /products
GET    /products/top
GET    /products/:id
POST   /products
PUT    /products/:id
DELETE /products/:id
```

### Categories

```text
GET    /categories
POST   /categories
PUT    /categories/:id
DELETE /categories/:id
GET    /categories/:id/thumbnail
```

### Discounts

```text
GET    /discounts
GET    /discounts/:id
POST   /discounts
PUT    /discounts/:id
DELETE /discounts/:id
```

### Reviews

```text
GET    /reviews
POST   /reviews
PUT    /reviews/:id
DELETE /reviews/:id
```

### Orders

```text
POST /orders
GET  /orders/my
GET  /orders
GET  /orders/:id
PUT  /orders/:id
```

### Files

```text
POST   /files/upload
DELETE /files?url=
```

## Reglas de compatibilidad JSON

- Mantener `_id` como string en respuestas.
- Mantener camelCase en JSON: `displayName`, `avatarUrl`, `createdAt`, `updatedAt`, `categoryId`, `imageUrl`, `avgRating`, `reviewCount`, `activeDiscount`.
- Las listas paginadas deben responder `{ items, total, page, limit }`.
- Las eliminaciones deben responder `{ success: true }`.
- Auth debe responder `{ user }` en login y `{ user, verificationEmail }` en register.
- No devolver `passwordHash`, `password_hash`, `refreshTokenHash` ni campos internos.

## Entregable de esta skill

Antes de implementar Flask, genera un archivo interno o seccion de README con:

```text
Contrato migrado:
- Rutas publicas
- Rutas protegidas por user/admin
- Query params
- Body schemas
- Response schemas
- Endpoints opcionales/no implementados y justificacion
```

## Anti-patrones

- No reescribir el frontend para adaptarlo a Flask.
- No cambiar `_id` por `id` en JSON publico sin serializer de compatibilidad.
- No devolver listas simples cuando el frontend espera paginacion.
- No devolver errores con formatos aleatorios.
- No asumir que solo existen products/users si el frontend llama categories, reviews, discounts u orders.

## Checklist

- [ ] Todos los endpoints usados por `apps/web/src/services` estan listados.
- [ ] Cada endpoint tiene metodo HTTP correcto.
- [ ] Cada endpoint tiene nivel de acceso claro.
- [ ] Cada respuesta conserva nombres de campos esperados.
- [ ] Las rutas de admin devuelven 403 con usuario no admin.
- [ ] Las rutas privadas devuelven 401 sin cookie JWT.
