---
name: practica2-sqlalchemy-repositories
description: Sustituir Mongoose/MongoDB por SQLite con SQLAlchemy y patron repositorio.
---

# SKILL.md - SQLAlchemy, SQLite y patron repositorio

## Objetivo

La practica exige persistencia real y recomienda SQLite con ORM. Esta skill guia la migracion desde entidades Mongoose a modelos SQLAlchemy manteniendo el JSON publico del frontend.

## Regla principal de compatibilidad

Aunque SQLAlchemy use `id`, el JSON debe exponer `_id`.

Ejemplo:

```python
class UserSchema(Schema):
    _id = fields.Function(lambda obj: str(obj.id))
```

## Recomendacion de IDs

Usa UUID string como primary key para parecerse a ObjectId string y evitar problemas con el frontend:

```python
import uuid
from sqlalchemy import String

id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
```

Alternativa aceptable: enteros autoincrementales, pero siempre serializados como string en `_id`.

## Modelos minimos

### User

Campos:

```text
id, email, password_hash, role, display_name, avatar_url,
refresh_token_hash, email_verified, created_at, updated_at
```

Restricciones:

- email unico
- role en `user/admin`

### Product

Campos:

```text
id, name, description, price, stock, image_url, category,
category_id, tags_json, created_by, created_at, updated_at
```

Notas:

- `tags` puede guardarse como JSON text o campo JSON si SQLite lo soporta.
- `created_by` referencia User.
- `category_id` referencia Category.

### Category

```text
id, name, icon, created_at, updated_at
```

- `name` unico.

### Discount

```text
id, product_id, discount_percent, start_date, end_date, created_at, updated_at
```

### Review

```text
id, product_id, user_id, score, comment, created_at, updated_at
```

- Unique constraint `(product_id, user_id)`.

### Order

```text
id, user_id, subtotal, total, status, currency, email, created_at, updated_at
```

### OrderItem

```text
id, order_id, product_id, name, image_url, unit_price, quantity, discount_percent, line_total
```

## Patron repositorio

Ejemplo:

```python
class ProductRepository:
    def get_by_id(self, product_id: str) -> Product | None:
        return db.session.get(Product, product_id)

    def list(self, *, q=None, category=None, category_id=None, page=1, limit=20):
        query = Product.query
        if q:
            query = query.filter(Product.name.ilike(f"%{q}%"))
        if category:
            query = query.filter(Product.category == category)
        if category_id:
            query = query.filter(Product.category_id == category_id)
        total = query.count()
        items = query.offset((page - 1) * limit).limit(limit).all()
        return items, total

    def save(self, product: Product):
        db.session.add(product)
        db.session.commit()
        return product
```

## Transacciones

Para crear orders:

- Validar que todos los productos existen.
- Verificar stock suficiente.
- Restar stock en la misma transaccion.
- Crear Order y OrderItems.
- Calcular subtotal y total.
- Hacer rollback si falla cualquier paso.

En SQLAlchemy:

```python
try:
    # operaciones
    db.session.commit()
except Exception:
    db.session.rollback()
    raise
```

## Campos derivados

### Product.avgRating y Product.reviewCount

Calcular en servicio o queries agregadas:

- `avgRating`: media de reviews del producto, redondeada a 2 decimales, o `null`.
- `reviewCount`: numero de reviews.

### Product.activeDiscount

Buscar descuento activo:

```text
start_date <= now <= end_date
```

Si hay varios, devolver el de mayor `discountPercent`.

### Category.productCount y Category.thumbnail

- `productCount`: count de productos con `category_id`.
- `thumbnail`: una `image_url` de producto de esa categoria o `null`.

## Anti-patrones

- Usar listas globales en memoria.
- Guardar datos en JSON plano como base de datos.
- Hacer queries SQLAlchemy dentro de routes.
- Mezclar reglas de negocio con modelos.
- Devolver objetos ORM directamente con `__dict__`.

## Checklist

- [ ] SQLite configurado en `.env.example`.
- [ ] `db.create_all()` o migracion simple documentada.
- [ ] Repositorio por recurso principal.
- [ ] No hay persistencia simulada.
- [ ] `_id` aparece en JSON.
- [ ] `createdAt` y `updatedAt` aparecen cuando el frontend los espera.
- [ ] Transacciones en orders.
- [ ] Unique email y unique review por usuario/producto.
