---
name: practica2-validation-errors
description: Implementar validacion estricta con Marshmallow y manejo global de excepciones en Flask.
---

# SKILL.md - Validaciones y errores globales

## Objetivo

Cumplir los puntos avanzados de la practica: validacion estricta de entrada y manejo global de excepciones.

## Dependencia

```txt
marshmallow
```

## Formato de error compatible

Todas las respuestas de error deben seguir:

```json
{
  "statusCode": 422,
  "errors": ["field: message"],
  "path": "/products",
  "timestamp": "2026-05-27T12:00:00Z",
  "requestId": "..."
}
```

## Excepciones de dominio

Define en `app/common/errors.py`:

```python
class AppError(Exception):
    status_code = 500
    message = "Internal server error"

class BadRequestError(AppError):
    status_code = 400

class UnauthorizedError(AppError):
    status_code = 401

class ForbiddenError(AppError):
    status_code = 403

class NotFoundError(AppError):
    status_code = 404

class ConflictError(AppError):
    status_code = 409

class ValidationAppError(AppError):
    status_code = 422
```

## Manejadores globales

Registrar handlers para:

- `marshmallow.ValidationError` -> 422.
- `AppError` -> status correspondiente.
- `IntegrityError` -> 409 o 400 segun caso.
- `Exception` -> 500 con mensaje generico.

## Schemas de entrada

### RegisterSchema

```python
class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=Length(min=6))
    displayName = fields.String(required=True, validate=Length(min=1))
```

### LoginSchema

```python
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=Length(min=6))
```

### CreateProductSchema

```python
class CreateProductSchema(Schema):
    name = fields.String(required=True, validate=Length(min=1))
    description = fields.String(load_default=None, allow_none=True)
    price = fields.Float(required=True, validate=Range(min=0))
    stock = fields.Integer(required=True, validate=Range(min=0))
    imageUrl = fields.String(load_default=None, allow_none=True)
    category = fields.String(load_default=None, allow_none=True)
    categoryId = fields.String(load_default=None, allow_none=True)
    tags = fields.List(fields.String(), load_default=list)
```

### CreateUserSchema

```python
class CreateUserSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=Length(min=6))
    displayName = fields.String(load_default=None, allow_none=True)
    role = fields.String(load_default="user", validate=OneOf(["user", "admin"]))
```

## Validacion parcial para updates

Usa `partial=True`:

```python
payload = UpdateProductSchema().load(request.get_json() or {}, partial=True)
```

## Serializacion

Usa schemas separados para salida cuando sea necesario:

- `UserPublicSchema`
- `ProductOutSchema`
- `PaginatedProductSchema` opcional

Reglas:

- No serializar passwords.
- Convertir fechas a ISO string.
- Convertir `id` interno a `_id`.
- Convertir snake_case a camelCase.

## Anti-patrones

- Validar manualmente todo con muchos `if` en las rutas.
- Devolver mensajes de error sin status code.
- Devolver stack traces al frontend.
- Usar 400 para todo.
- Aceptar campos invalidos sin reportarlos.

## Checklist

- [ ] Todos los POST/PUT/PATCH usan Marshmallow.
- [ ] Datos invalidos devuelven 422.
- [ ] Errores de negocio no provocan HTML error pages.
- [ ] Respuesta de error incluye `statusCode`, `errors`, `path`, `timestamp`.
- [ ] No se filtran stacks ni secretos.
- [ ] La memoria de IA puede citar este diseño como correccion manual frente a codigo generado sin validacion.
