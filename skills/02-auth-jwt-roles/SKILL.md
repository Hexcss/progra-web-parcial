---
name: practica2-auth-jwt-roles
description: Migrar autenticacion NestJS basada en JWT y cookies HTTP-only a Flask.
---

# SKILL.md - JWT, cookies y roles en Flask

## Objetivo

Reproducir la autenticacion del backend NestJS en Flask sin romper el frontend.

El frontend usa `fetch` con `credentials: 'include'`, por tanto el backend Flask debe usar cookies HTTP-only llamadas exactamente:

```text
accessToken
refreshToken
```

## Dependencias

```txt
Flask-JWT-Extended
argon2-cffi
```

## Payload del JWT

El access token debe incluir:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user",
  "emailVerified": false
}
```

Roles validos:

```text
user
admin
```

Niveles:

```python
ROLE_LEVELS = {"user": 10, "admin": 100}
```

## Endpoints auth

### POST /auth/register

Entrada:

```json
{
  "email": "newuser@example.com",
  "password": "supersecret",
  "displayName": "John Doe"
}
```

Respuesta:

```json
{
  "user": {
    "_id": "...",
    "email": "newuser@example.com",
    "displayName": "John Doe",
    "role": "user",
    "emailVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "verificationEmail": {
    "attempted": false,
    "sent": false,
    "id": null,
    "error": null
  }
}
```

Debe setear cookies `accessToken` y `refreshToken`.

### POST /auth/login

Entrada:

```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

Respuesta:

```json
{ "user": { "_id": "...", "email": "...", "role": "user" } }
```

Debe setear cookies `accessToken` y `refreshToken`.

### GET /auth/me

Respuesta:

```json
{ "sub": "...", "email": "user@example.com", "role": "user" }
```

### POST /auth/logout

Respuesta:

```json
{ "success": true }
```

Debe limpiar cookies.

## Decorators recomendados

Implementa:

```python
def auth_required(fn):
    ...

def roles_required(min_role: str):
    ...
```

Comportamiento:

- Sin access token ni refresh token valido: 401.
- Access token valido: guardar user actual en `g.current_user`.
- Access token expirado y refresh token valido: emitir cookies nuevas y permitir request.
- Usuario autenticado pero rol insuficiente: 403.

## Cookies

```python
def set_auth_cookies(response, access_token, refresh_token):
    response.set_cookie(
        "accessToken",
        access_token,
        httponly=True,
        secure=current_app.config["COOKIE_SECURE"],
        samesite=current_app.config.get("COOKIE_SAMESITE", "Lax"),
        path="/",
        max_age=current_app.config["JWT_ACCESS_MAX_AGE_SECONDS"],
    )
    response.set_cookie(
        "refreshToken",
        refresh_token,
        httponly=True,
        secure=current_app.config["COOKIE_SECURE"],
        samesite=current_app.config.get("COOKIE_SAMESITE", "Lax"),
        path="/",
        max_age=current_app.config["JWT_REFRESH_MAX_AGE_SECONDS"],
    )
```

## Seguridad minima

- Hash de password con Argon2.
- Emails normalizados a minusculas y trim.
- No devolver hash en respuestas.
- Secretos JWT desde `.env`, no hardcodeados.
- Cookies HTTP-only.
- CORS con credenciales solo para origen configurado.

## Errores esperados

- Credenciales invalidas: 401.
- Email duplicado: 409.
- Token ausente o invalido: 401.
- Rol insuficiente: 403.
- Body invalido: 422.

## Tests minimos

- Registro crea usuario y setea cookies.
- Login setea cookies.
- `/auth/me` responde con cookie valida.
- `/users/me` responde con cookie valida.
- Usuario normal recibe 403 al crear producto.
- Admin puede crear producto.
- Logout borra cookies.

## Anti-patrones

- Guardar JWT en localStorage si el frontend ya usa cookies.
- Cambiar los nombres de cookie.
- Devolver tokens en JSON como unico mecanismo.
- Ignorar refresh token si el proyecto anterior lo usaba.
- Responder 200 con error en body.
