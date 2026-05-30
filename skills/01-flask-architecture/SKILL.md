---
name: practica2-flask-architecture
description: Crear una arquitectura Flask limpia por capas para cumplir la Practica 2.
---

# SKILL.md - Arquitectura Flask limpia

## Objetivo

Construir el nuevo backend en Flask con separacion clara de responsabilidades:

- Routes/controllers: HTTP, request, response.
- Services: logica de negocio.
- Repositories: acceso a base de datos.
- Models: SQLAlchemy ORM.
- Schemas: Marshmallow para validacion y serializacion.

La practica prohibe centralizar toda la logica en el archivo principal de rutas.

## Estructura recomendada

```text
apps/api/
  app/
    __init__.py
    config.py
    extensions.py
    common/
      auth.py
      errors.py
      pagination.py
      security.py
      serialization.py
    modules/
      <resource>/
        routes.py
        service.py
        repository.py
        model.py
        schemas.py
  run.py
  requirements.txt
  .env.example
  README.md
```

## App factory

Usa `create_app()`:

```python
from flask import Flask
from .config import Config
from .extensions import db, jwt, cors
from .common.errors import register_error_handlers


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, supports_credentials=True, origins=app.config["CORS_ORIGINS"])

    register_error_handlers(app)

    from .modules.health.routes import bp as health_bp
    from .modules.auth.routes import bp as auth_bp
    from .modules.users.routes import bp as users_bp
    from .modules.products.routes import bp as products_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(products_bp, url_prefix="/products")

    with app.app_context():
        db.create_all()

    return app
```

## Responsabilidades por capa

### routes.py

Debe:

- Leer JSON o query params.
- Invocar schema Marshmallow para validar.
- Llamar al servicio.
- Devolver `jsonify(...)` y status code.

No debe:

- Hacer queries SQLAlchemy directas.
- Hashear passwords.
- Calcular descuentos complejos.
- Decidir reglas de ownership.

### service.py

Debe:

- Aplicar reglas de negocio.
- Coordinar varios repositorios.
- Lanzar excepciones de dominio.
- Calcular campos derivados como `avgRating`, `reviewCount`, `activeDiscount`.

### repository.py

Debe:

- Encapsular SQLAlchemy.
- Tener metodos como `find_by_id`, `list`, `create`, `update`, `delete`.
- No depender de Flask request.

### model.py

Debe:

- Definir tablas, relaciones, indices y timestamps.
- Usar nombres internos Python/SQL en snake_case.
- No devolver dicts directamente al frontend sin serializer.

### schemas.py

Debe:

- Validar entrada con Marshmallow.
- Serializar salida compatible con el frontend.
- Convertir snake_case interno a camelCase externo.
- Exponer `_id` como string.

## Convenciones de nombres

- Interno Python: `display_name`, `avatar_url`, `created_at`.
- JSON externo: `displayName`, `avatarUrl`, `createdAt`.
- ID externo: `_id`.

## Orden de implementacion

1. `app/extensions.py`
2. `app/config.py`
3. `app/common/errors.py`
4. `app/common/security.py`
5. `app/common/auth.py`
6. `health`
7. `users`
8. `auth`
9. `products`
10. resto de modulos

## Anti-patrones

- Un unico `app.py` con todas las rutas y logica.
- Modelos SQLAlchemy devolviendo JSON de frontend directamente sin control.
- Repositorios que conocen JWT o roles.
- Servicios que devuelven objetos SQLAlchemy sin serializar.
- Excepciones genericas sin mapear.

## Checklist

- [ ] Hay app factory.
- [ ] Hay blueprints por modulo.
- [ ] Cada modulo tiene routes, service, repository, model y schemas cuando aplica.
- [ ] No hay logica de negocio centralizada en `run.py`.
- [ ] El README explica la estructura.
- [ ] La arquitectura permite explicar separacion de responsabilidades en la memoria.
