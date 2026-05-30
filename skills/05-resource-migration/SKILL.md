---
name: practica2-resource-migration
description: Migrar recursos principales de NestJS/Mongoose a Flask manteniendo endpoints y JSON.
---

# SKILL.md - Migracion de recursos y endpoints

## Objetivo

Implementar los recursos principales del backend en Flask preservando contrato:

- Productos: CRUD completo protegido por roles.
- Usuarios: CRUD completo con roles user/admin.
- Recursos adicionales usados por el frontend: categories, discounts, reviews, orders y files.

## Prioridad de implementacion

1. Auth
2. Users
3. Products
4. Categories
5. Reviews
6. Discounts
7. Orders
8. Files
9. OAuth/email opcional

## Products

### Query params de `GET /products`

```text
q?: string
category?: string
categoryId?: string
page?: number
limit?: number
sort?: 'new' | 'priceAsc' | 'priceDesc' | 'rating'
```

Respuesta:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

### Reglas

- Publico para listar, ver detalle y top.
- Admin para crear, editar y borrar.
- `avgRating` y `reviewCount` calculados desde reviews.
- `activeDiscount` calculado desde discounts activos.
- `tags` siempre array, aunque venga ausente.

### Errores

- Producto inexistente: 404.
- Body invalido: 422.
- No autenticado en escritura: 401.
- Usuario no admin en escritura: 403.

## Users

### Reglas

- `/users/me` y `PATCH /users/me` requieren cualquier usuario autenticado.
- CRUD `/users` requiere admin.
- `POST /users` acepta `role`, por defecto `user`.
- `PATCH /users/:id` permite actualizar `displayName`, `avatarUrl`, `role`.
- Nunca devolver password/hash.

### Listado

Query:

```text
q?: string
role?: 'user' | 'admin'
limit?: number
page?: number
```

Respuesta:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

## Categories

### Reglas

- Listado y detalle publicos.
- Escritura admin.
- `productCount` = numero de productos por categoria.
- `thumbnail` = imageUrl de algun producto de la categoria o null.

## Reviews

### Reglas

- `GET /reviews` publico, requiere `productId`.
- `POST /reviews` requiere user/admin.
- Un usuario solo puede crear una review por producto.
- Owner o admin puede editar/borrar.
- Score entre 1 y 5.
- Respuesta enriquecida con `user`.

## Discounts

### Reglas

- Listado y detalle publicos.
- Escritura admin.
- `discountPercent` entre 0 y 100.
- `startDate` y `endDate` en ISO date/datetime.
- Validar que `endDate >= startDate`.

## Orders

### Reglas

- Crear order requiere user/admin.
- Debe verificar stock.
- Debe restar stock en transaccion.
- Debe aplicar descuento activo al precio unitario.
- `GET /orders/my` devuelve solo pedidos del usuario actual.
- `GET /orders` admin.
- `GET /orders/:id` owner o admin.
- `PUT /orders/:id` admin para status.

## Files

Para practica, si no se usa almacenamiento cloud:

- Guardar localmente en `uploads/`.
- Devolver URL relativa o absoluta compatible con frontend.
- Validar extension/tamano si es facil.
- `DELETE /files?url=` elimina si existe y devuelve `{ success: true }`.

## OAuth y email

El backend NestJS tiene endpoints OAuth y envio de email. Para la practica pueden quedar fuera si no son esenciales.

Opciones aceptables:

1. Implementarlos realmente si hay tiempo.
2. Mantener endpoints con `501 Not Implemented` estructurado y documentar que no forman parte del alcance evaluado.
3. Para `verificationEmail`, devolver siempre:

```json
{
  "attempted": false,
  "sent": false,
  "id": null,
  "error": null
}
```

## Checklist de contrato

- [ ] Rutas coinciden exactamente.
- [ ] Metodos HTTP coinciden.
- [ ] Query params coinciden.
- [ ] Body schemas coinciden.
- [ ] Respuestas usan `_id` y camelCase.
- [ ] Paginacion usa `{ items, total, page, limit }`.
- [ ] Deletes usan `{ success: true }`.
- [ ] Roles coinciden.
- [ ] Errores coinciden.
