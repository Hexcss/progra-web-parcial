# Portal de Productos con Autenticación y Chat (Monorepo NestJS + React)

[![NestJS](https://img.shields.io/badge/NestJS-HTTP%20API-E0234E?logo=nestjs&logoColor=white)](#)
[![NestJS](https://img.shields.io/badge/NestJS-Socket.IO-E0234E?logo=nestjs&logoColor=white)](#)
[![React](https://img.shields.io/badge/React%20%2B%20Vite-Frontend-61DAFB?logo=react&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Chat-010101?logo=socket.io&logoColor=white)](#)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](#)
[![MUI](https://img.shields.io/badge/MUI-v7-007FFF?logo=mui&logoColor=white)](#)

> **Asignatura:** Programación Web  
> **Práctica 1:** Portal de productos con autenticación y chat (JWT + Socket.IO)  
> **Stack:** NestJS (API + Gateway), React + Vite + TS, MongoDB, MUI.


## 🧭 Índice

- [🎯 Objetivo](#-objetivo)
- [🏗️ Arquitectura](#️-arquitectura)
- [🗃️ Modelo de Datos (DBML)](#️-modelo-de-datos-dbml)
- [🔐 Roles, JWT y Protección](#-roles-jwt-y-protección)
- [🛣️ Endpoints y Eventos](#️-endpoints-y-eventos)
- [📁 Estructura del Monorepo](#-estructura-del-monorepo)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [▶️ Puesta en Marcha](#️-puesta-en-marcha)
- [🧪 Pruebas rápidas](#-pruebas-rápidas)
- [🛡️ Seguridad y Buenas Prácticas](#️-seguridad-y-buenas-prácticas)
- [📝 Criterios de Evaluación (mapeo)](#-criterios-de-evaluación-mapeo)
- [🚀 Roadmap y Ampliaciones](#-roadmap-y-ampliaciones)


## 🎯 Objetivo

Portal completo que integra:

- **CRUD de productos** conectado a **MongoDB**.  
- **Sistema de usuarios** con **registro, login y roles** (user/admin).  
- **Autenticación JWT** para proteger rutas HTTP y **sockets**.  
- **Chat en tiempo real** (Socket.IO) **solo para usuarios autenticados**.  
- **Documentación** clara para ejecutar y evaluar.

## 🏗️ Arquitectura

```mermaid
flowchart LR
  A[Cliente (React + Vite + MUI)] -- HTTP (REST) --> B[NestJS API (backend/api)]
  A ---|"WebSocket (Socket.IO + JWT)"| C[NestJS Gateway (backend/gateway)]
  B <---> D[(MongoDB)]
  C <---> D[(MongoDB)]
  subgraph GCP
    D[(MongoDB en Compute Engine)]
  end
  A ---|"JWT en Authorization / Handshake"| B
  A ---|"JWT en query/header"| C
```

**Decisiones clave**
- Separación **HTTP** (API) y **Tiempo Real** (Gateway) en **dos apps NestJS**.  
- **JWT** firmado con el mismo secreto en ambos servicios.  
- **MongoDB** compartido por ambos (API: usuarios y productos; Gateway: mensajes del chat).  
- Frontend React + Vite + TS + tu stack (MUI, Router v7, Zustand/Signals, React Query, Axios, Framer Motion, Zod...).

## 🗃️ Modelo de Datos (DBML)

> Modelamos colecciones como tablas para claridad (DBML). Los índices y referencias ayudan a la evaluación.

```dbml
Project {
  database_type: "mongodb-like"
  note: "Colecciones Mongo modeladas en DBML"
}

Table users as "users" {
  _id objectid [pk, note: "ObjectId"]
  email string [unique, not null]
  passwordHash string [not null, note: "bcrypt"]
  role string [not null, note: "enum: user|admin"]
  displayName string
  avatarUrl string
  createdAt datetime [not null]
  updatedAt datetime [not null]
  Indexes {
    (email) [unique]
    (role)
    (createdAt)
  }
}

Table products as "products" {
  _id objectid [pk]
  name string [not null]
  description string
  price double [not null]
  stock int [not null, default: 0]
  imageUrl string
  category string
  tags string[]  // arreglo de strings
  createdBy objectid [ref: > users._id]
  createdAt datetime [not null]
  updatedAt datetime [not null]
  Indexes {
    (name)
    (category)
    (createdAt)
  }
}

Table chat_rooms as "chat_rooms" {
  _id objectid [pk]
  name string
  isDirect boolean [not null, default: false]
  participants objectid[] [ref: > users._id]
  createdAt datetime [not null]
  Indexes {
    (isDirect)
  }
}

Table chat_messages as "chat_messages" {
  _id objectid [pk]
  roomId objectid [ref: > chat_rooms._id, not null]
  userId objectid [ref: > users._id, not null]
  content string [not null]
  createdAt datetime [not null]
  Indexes {
    (roomId, createdAt)
    (userId, createdAt)
  }
}
```

> **Simplificación por defecto:** un **room** global `"general"` y persistencia de mensajes.  
> **Opcional (extra):** rooms privados y DM (isDirect).

## 🔐 Roles, JWT y Protección

- **Roles:**  
  - `user`: puede **listar/ver** productos y usar el **chat**.  
  - `admin`: además puede **crear/editar/eliminar** productos.

- **JWT HTTP:**  
  - `Authorization: Bearer <token>` en rutas protegidas.  
  - Estrategia `JwtStrategy` en API + `JwtAuthGuard`.

- **JWT Socket.IO:**  
  - Handshake con `auth: { token }` o `Authorization` header.  
  - Guard `WsJwtGuard` que rechaza conexiones no válidas.

- **Expiración sugerida:** `15m` de access token (refresco opcional fuera de alcance de la práctica).

## 🛣️ Endpoints y Eventos

### API (HTTP - backend/api)

| Método | Ruta                 | Auth      | Rol       | Descripción                     |
|-------:|----------------------|-----------|-----------|---------------------------------|
|   POST | `/auth/register`     | Pública   | —         | Registra usuario (hash bcrypt). |
|   POST | `/auth/login`        | Pública   | —         | Devuelve JWT.                   |
|    GET | `/products`          | Pública   | —         | Lista productos (público).      |
|    GET | `/products/:id`      | Pública   | —         | Detalle de producto.            |
|   POST | `/products`          | JWT       | **admin** | Crear producto.                 |
|    PUT | `/products/:id`      | JWT       | **admin** | Editar producto.                |
| DELETE | `/products/:id`      | JWT       | **admin** | Eliminar producto.              |

### Gateway (WebSocket - backend/gateway)

**Namespace:** `/chat`  
**Handshake:** requiere JWT válido.

| Evento cliente → servidor | Payload                        | Respuesta/efecto                         |
|---------------------------|--------------------------------|------------------------------------------|
| `chat:join`               | `{ roomId }`                   | Une al cliente al room.                  |
| `chat:leave`              | `{ roomId }`                   | Sale del room.                           |
| `chat:message`            | `{ roomId, content }`          | Persiste y emite a room (`chat:new`).    |
| `chat:typing` (opcional)  | `{ roomId, isTyping }`         | Broadcast estado de “escribiendo…”.      |
| `chat:history`            | `{ roomId, limit? }`           | Devuelve últimos N mensajes.             |

**Servidor → cliente**

- `chat:new` → `{ _id, roomId, user, content, createdAt }`  
- `chat:typing` → `{ roomId, user, isTyping }`

## 📁 Estructura del Monorepo

```text
portal-productos-chat/
├─ README.md
├─ docker-compose.yml
├─ package.json
├─ backend/
│  ├─ api/       # NestJS HTTP (auth + productos)
│  └─ gateway/   # NestJS Socket.IO (chat)
└─ frontend/     # React + Vite + TS + MUI
```

**Workspaces (root `package.json`):**

```json
{
  "name": "portal-productos-chat",
  "private": true,
  "workspaces": [
    "backend/api",
    "backend/gateway",
    "frontend"
  ],
  "scripts": {
    "postinstall": "npm run build -ws --if-present=false",
    "dev": "concurrently -n API,GW,WEB -c green,yellow,cyan \"npm -w backend/api run start:dev\" \"npm -w backend/gateway run start:dev\" \"npm -w frontend run dev\"",
    "start": "concurrently -n API,GW,WEB -c green,yellow,cyan \"npm -w backend/api run start:prod\" \"npm -w backend/gateway run start:prod\" \"npm -w frontend run preview\"",
    "lint": "npm -ws run lint",
    "build": "npm -ws run build"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

## ⚙️ Variables de Entorno

### API (`backend/api/.env`)

```bash
PORT=4000
MONGO_URI=mongodb://localhost:27017/portal
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=15m
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
```

### Gateway (`backend/gateway/.env`)

```bash
PORT=4001
MONGO_URI=mongodb://localhost:27017/portal
JWT_SECRET=super-secret-change-me
CORS_ORIGIN=http://localhost:5173
CHAT_DEFAULT_ROOM=general
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4001
```

> En Docker Compose, `MONGO_URI` usará `mongodb://mongo:27017/portal`.

## ▶️ Puesta en Marcha

### Opción A) Local (sin Docker)

1) Instalar dependencias en monorepo:

```bash
npm install
```

2) Levantar todo en modo dev (watch):

```bash
npm run dev
```

- API: <http://localhost:4000>  
- Gateway (WS): <http://localhost:4001/chat>  
- Frontend: <http://localhost:5173>

> Asegúrate de tener MongoDB 7.x local (`MONGO_URI` apuntando a localhost).

### Opción B) Docker Compose (local + persistencia)

`docker-compose.yml` (raíz del repo):

```yaml
version: "3.9"

services:
  mongo:
    image: mongo:7
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - ./docker/mongo/data:/data/db
    environment:
      MONGO_INITDB_DATABASE: portal
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "mongodb://localhost:27017/portal", "--eval", "db.runCommand({ ping: 1 }).ok"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  api:
    build: ./backend/api
    container_name: api
    env_file: ./backend/api/.env
    environment:
      MONGO_URI: mongodb://mongo:27017/portal
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "4000:4000"
    depends_on:
      - mongo
    restart: unless-stopped

  gateway:
    build: ./backend/gateway
    container_name: gateway
    env_file: ./backend/gateway/.env
    environment:
      MONGO_URI: mongodb://mongo:27017/portal
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "4001:4001"
    depends_on:
      - mongo
      - api
    restart: unless-stopped

  web:
    build: ./frontend
    container_name: web
    environment:
      VITE_API_URL: http://localhost:4000
      VITE_WS_URL: http://localhost:4001
    ports:
      - "5173:5173"
    depends_on:
      - api
      - gateway
    restart: unless-stopped
```

Levantar:

```bash
docker compose up -d --build
```

## 🧪 Pruebas rápidas

### Registro & Login

```bash
# Registro
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@acme.com","password":"123456","displayName":"Test"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@acme.com","password":"123456"}'
# => { access_token: "..." }
```

### CRUD Productos (admin)

```bash
TOKEN="PEGA_AQUI_EL_TOKEN"

# Crear (admin)
curl -X POST http://localhost:4000/products \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Teclado Mecanico","price":79.9,"stock":5,"category":"Periféricos"}'
```

### Chat (Socket.IO)

- Conectar a `ws://localhost:4001/chat` con `auth: { token }`.  
- `emit("chat:join", { roomId: "general" })`  
- `emit("chat:message", { roomId: "general", content: "Hola :)" })`


## 🛡️ Seguridad y Buenas Prácticas

- **Argon2** para passwords; **nunca** almacenar en claro.  
- **JWT** con expiración corta; reemisión en login.  
- **Helmet, CORS estricto** (orígenes conocidos).  
- **Validación** de DTOs (class-validator) y **sanitización**.  
- **Indices Mongo** creados desde los esquemas.  
- **Guards** separados para HTTP y WS (evita accesos anónimos).  
- **Logs mínimos + DTOs bien tipados** para cumplir “claridad” en evaluación.


