# Progra Web Parcial — Documentación del Sistema

> Proyecto universitario de arquitectura web moderna con **Frontend (React + Vite + MUI)**, **API REST (NestJS)**, **Gateway WebSocket (NestJS + Socket.IO)** y **MongoDB**. Desplegado en **Google Cloud Run** con **CI/CD en GitHub Actions** y autenticación mediante **JWT en cookies HttpOnly** y **OAuth (Google y GitHub)**.

- Link del Repositorio: https://github.com/Hexcss/progra-web-parcial.git
- Link del Sitio: https://store.hexcss.com

## Índice

1. [Objetivo del proyecto](#objetivo-del-proyecto)  
2. [Visión general de la arquitectura](#visión-general-de-la-arquitectura)  
3. [Decisiones de diseño (el “por qué”)](#decisiones-de-diseño-el-por-qué)  
   - [Separación en servicios (sistema distribuido)](#separación-en-servicios-sistema-distribuido)  
   - [JWT en cookies HttpOnly vs LocalStorage](#jwt-en-cookies-httponly-vs-localstorage)  
   - [Autenticación para WebSockets](#autenticación-para-websockets)  
   - [Elección de Google Cloud Run](#elección-de-google-cloud-run)  
   - [Uso de OAuth (Google y GitHub)](#uso-de-oauth-google-y-github)  
   - [Argon2 frente a bcrypt](#argon2-frente-a-bcrypt)  
4. [Modelo de datos (MongoDB)](#modelo-de-datos-mongodb)  
5. [Estructura del repositorio](#estructura-del-repositorio)  
6. [Requisitos previos](#requisitos-previos)  
7. [Variables de entorno](#variables-de-entorno)  
8. [Puesta en marcha local](#puesta-en-marcha-local)  
9. [Despliegue en Google Cloud Run](#despliegue-en-google-cloud-run)  
10. [CI/CD con GitHub Actions](#cicd-con-github-actions)  
11. [Pruebas manuales recomendadas](#pruebas-manuales-recomendadas)  
12. [Resumen técnico de decisiones](#resumen-técnico-de-decisiones)  
13. [Licencia y autores](#licencia-y-autores)


## Objetivo del proyecto

Construir una aplicación web moderna, segura y escalable que permita:

- Autenticación con **email/contraseña** y **OAuth (Google/GitHub)**.  
- Consumo de un **API REST** con **JWT en cookies HttpOnly**.  
- **Chat de soporte** en tiempo real mediante Gateway **WebSocket**.  
- Persistencia en **MongoDB**.  
- Despliegue reproducible y de bajo mantenimiento en **Google Cloud Run**.  
- Automatización de ramas y despliegues con **GitHub Actions**.


## Visión general de la arquitectura

- **Frontend (React + Vite + MUI)**: interfaz del marketplace/portal, flujo de login/signup, inicio de OAuth, consumo del API vía fetch/axios y conexión a WebSocket con ticket efímero.
- **API REST (NestJS)**:  
  - Autenticación con **JWT** (cookies HttpOnly, `SameSite=Lax`, rotación de tokens).  
  - **OAuth** con Google y GitHub (intercambio de código en el servidor, emisión de cookies y redirección al cliente).  
  - Endpoints de negocio (usuarios, soporte, etc.).  
  - Emisión de **tickets cortos** para el **handshake WebSocket**.
- **Gateway WebSocket (NestJS + Socket.IO)**:  
  - Conexión autenticada con **ticket de 60s**.  
  - Salas, mensajes y eventos del chat de soporte.  
- **MongoDB**: base de datos documental para usuarios, salas y mensajes.  
- **CI/CD con GitHub Actions**: sincroniza subcarpetas a ramas homónimas y posibilita pipelines independientes.  
- **Google Cloud Run**: contenedores serverless, HTTPS, autoscaling y soporte de WebSockets.

## Decisiones de diseño (el “por qué”)

### Separación en servicios (sistema distribuido)

- **Despliegue independiente**: API y Gateway evolucionan y escalan por separado.  
- **Coste y rendimiento**: el tráfico HTTP (ráfagas cortas) y WS (conexiones largas) tienen perfiles distintos; separarlos optimiza consumo y tuning.  
- **Reducción de riesgo**: un pico o bug en chat no degrada el API crítico.  
- **Límites claros**: API = CRUD/negocio; Gateway = tiempo real.

### JWT en cookies HttpOnly vs LocalStorage

- **Mitigación de XSS**: las **cookies HttpOnly** no son accesibles por JavaScript; se reduce la exfiltración de tokens.  
- **`SameSite=Lax`**: protege la mayoría de escenarios CSRF en navegación.  
- **Ergonomía**: el navegador adjunta la cookie automáticamente; el cliente no gestiona headers manualmente.  
- **Rotación/expiración controlada**: el servidor controla el ciclo de vida y la renovación con **refresh tokens**.

> Nota: los endpoints sensibles se endurecen con validaciones, y es posible añadir **tokens CSRF** o **idempotency keys** para operaciones críticas.

### Autenticación para WebSockets

- Los handshakes **no** comparten las mismas garantías de cookies que `fetch`.  
- Se utiliza un **ticket JWT efímero (≈60s)** emitido por el API (`GET /auth/ws-ticket`).  
- El cliente abre Socket.IO con `auth: { token }`.  
- El Gateway valida el ticket y establece la sesión WS sin exponer refresh tokens.

### Elección de Google Cloud Run

- **Serverless de contenedores** con **HTTPS** y **WebSockets**.  
- **Autoscaling a 0**: coste mínimo en entornos con baja demanda (idóneo para proyectos académicos).  
- **Logging/metrics** integrados, revisiones y traffic-splitting.  
- **Infra simplificada**: sin gestionar VMs ni balanceadores manuales.

### Uso de OAuth (Google y GitHub)

- **Menos fricción**: inicio de sesión con cuentas existentes.  
- **Emails verificados**: evita construir flujos de verificación.  
- **Seguridad**: se heredan MFA y señales de riesgo del proveedor.  
- **Implementación server-side**: intercambio de código y emisión de cookies **en el servidor**; nunca se exponen tokens de proveedor al navegador.

### Argon2 frente a bcrypt

- **Argon2id** es resistente a ataques GPU/ASIC y **memory-hard** (ganador del PHC).  
- **Parámetros modernos** y perfiles de seguridad robustos.  
- **Buena adopción** en ecosistemas Node/Nest modernos.

## Modelo de datos (MongoDB)

Entidades principales:

- **users**  
  - `_id`, `email` (único), `passwordHash`, `displayName`, `role` (`user|admin`), `createdAt`, `updatedAt`.  
  - Índice único: `email`.

- **supportRooms**  
  - `_id`, `customerId` (→ users), `adminId` (→ users), `status` (`waiting|assigned|closed`), `createdAt`, `updatedAt`, `lastMessageAt`.  
  - Índices: `(status, updatedAt)`, `(adminId, updatedAt)`.

- **supportMessages**  
  - `_id`, `roomId` (→ supportRooms), `senderId` (→ users), `senderRole` (`user|admin`), `body`, `createdAt`, `updatedAt`.  
  - Índice: `(roomId, createdAt)`.

Se adoptó **MongoDB** por su orientación a documentos, agilidad de iteración en esquemas y facilidad para modelar conversaciones (mensajes anidados por sala + orden natural por tiempo).

## Estructura del repositorio

```text
/
├─ backend/
│  ├─ api/           # NestJS API (REST, Auth, OAuth, emisión de tickets WS)
│  └─ gateway/       # NestJS Gateway (Socket.IO, chat tiempo real)
├─ frontend/         # React + Vite + MUI
├─ docs/             # (diagramas: .puml/.mmd/.dbml + PNGs)
├─ docker-compose.yml # Servicios locales (p.ej. MongoDB)
└─ .github/workflows  # CI (split de subcarpetas a ramas)
```

## Requisitos previos

- **Node.js 20+**  
- **pnpm (preferiblemente)**  
- **Docker** (para lanzar MongoDB local con `docker-compose`)  
- **Cuenta de Google Cloud** (para Cloud Run)  
- **Cuenta de GitHub** (para OAuth y CI)

## Variables de entorno

Archivo `backend/api/.env`:

```env
PORT=4000
NODE_ENV=development
LOG_LEVEL=debug

# CORS y URL del cliente (la URL de Vite o dominio del frontend)
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb://localhost:27017/portal

# JWT
JWT_ACCESS_SECRET=dev-access-secret-cámbiame
JWT_REFRESH_SECRET=dev-refresh-secret-cámbiame
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# OAuth (Google)
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...

# OAuth (GitHub)
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...
```

> **Importante (cookies + redirecciones)**: el servidor **siempre** establece las cookies en su propio dominio/origen (API). Tras OAuth, el servidor **redirecciona al CLIENT_URL**. Las cookies quedan almacenadas para el dominio del API y serán enviadas en futuras peticiones **desde el frontend hacia el API**.

## Puesta en marcha local

1) **Todos los servicios + Base de datos** (Docker):
```bash
docker compose up -d
# o:
# docker run --name mongo -p 27017:27017 -d mongo:6
```

2) **Backend API**:
```bash
cd backend/api
pnpm install
pnpm start:dev
```

3) **Gateway WebSocket**:
```bash
cd backend/gateway
pnpm install
pnpm start:dev
```

4) **Frontend**:
```bash
cd frontend
pnpm install
pnpm dev
# abre http://localhost:5173
```

## Despliegue en Google Cloud Run

1) **Construir imágenes** (ejemplo API):
```bash
cd backend/api
docker build -t gcr.io/<PROYECTO>/portal-api:<TAG> .
docker push gcr.io/<PROYECTO>/portal-api:<TAG>
```

2) **Desplegar**:
```bash
gcloud run deploy portal-api \
  --image gcr.io/<PROYECTO>/portal-api:<TAG> \
  --platform managed \
  --region <REGION> \
  --allow-unauthenticated \
  --port 4000
```

3) **Configurar variables de entorno** (Cloud Run → Revisiones → Variables y secretos).  
4) **Configurar dominio** (opcional) y HTTPS administrado.  
5) **Ajustes recomendados**:
   - Min instances: 0 (ahorro)  
   - Max instances: según carga  
   - Concurrency: 80–200 para API; inferior en Gateway si hay muchas conexiones largas  
   - Timeout: 30–60s (API), mayor si el Gateway lo requiere  
   - **WebSockets**: Cloud Run los soporta sin configuración extra.  
   - **MongoDB**: usar MongoDB Atlas o red privada; configurar `MONGO_URI` seguro.  

## CI/CD con GitHub Actions

El workflow **“Sync Folders to Branches”** crea/push ramas a partir de subcarpetas (`frontend`, `backend/api`, `backend/gateway`) para facilitar pipelines separadas.

- Añadir **secreto** `REPO_ACCESS_TOKEN` (token clásico PAT con `repo` scope).  
- El workflow ejecuta `git subtree split` y hace push forzado a las ramas-hijas.  
- Desde ahí se pueden conectar despliegues automáticos por servicio.


## Pruebas manuales recomendadas

1) **Registro y login** con email/contraseña:
   - `POST /auth/register` desde el frontend y comprobar cookies HttpOnly.
   - `POST /auth/login` y luego `GET /auth/me`.

2) **OAuth**:
   - Botón “Continuar con Google/GitHub” → flujo de consentimiento.  
   - Verificación de que el servidor emite cookies y redirige a `CLIENT_URL`.  

3) **Ticket WebSocket**:
   - `GET /auth/ws-ticket` autenticado.  
   - Conectar Socket.IO con `auth: { token }` y enviar/recibir mensajes.

4) **Soporte**:
   - Crear sala, enviar mensajes desde usuario y desde portal/admin.  
   - Cerrar sala y verificar estados/listados.


## Resumen técnico de decisiones

- **Sistema distribuido** para aislar cargas HTTP y WS, reducir coste y riesgos.  
- **JWT en cookies HttpOnly** por seguridad (XSS) y ergonomía del cliente.  
- **Ticket WS efímero** para handshakes seguros sin exponer refresh tokens.  
- **Cloud Run** por simplicidad operativa, HTTPS y autoscaling a 0.  
- **OAuth** para reducir fricción y heredar seguridad de proveedores.  
- **Argon2id** como función de hashing moderna y memory-hard.  
- **MongoDB** por su flexibilidad documental y patrón de acceso simple para chats.


## Licencia y autores

- **Licencia:** MIT  
- **Autores:** Javier Cáder Suay

> Para ampliar esta documentación se incluirán **diagramas** en la carpeta `/docs/` (PUML/Mermaid/DBML + PNGs) describiendo componentes, secuencias (login/OAuth) y el modelo de datos.

