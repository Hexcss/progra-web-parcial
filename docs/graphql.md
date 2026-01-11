# Migración a GraphQL y funcionamiento actual

## 1) Estado actual y puntos de entrada

- **API GraphQL**: `POST /graphql`
- **Esquema generado**: `backend/api/schema.gql` (code-first con decorators de NestJS).
- **REST residual**: solo para OAuth y verificación de email (`/auth/oauth/*` y `/auth/verify-email`).
- **Gateway WS**: permanece separado en `backend/gateway` para el chat de soporte.

## 2) Cómo funciona la API GraphQL

### Backend (NestJS)
- **Resolvers** reemplazan controllers REST y exponen queries/mutations.
- **Servicios** se mantienen intactos; la lógica de negocio no cambia.
- **Contexto GraphQL** incluye `req/res` para reutilizar autenticación y cookies.
- **Guards/filters/interceptors** adaptados a `GqlExecutionContext`.

### Frontend (React)
- **Cliente GraphQL**: `frontend/src/backend/clients/graphql.client.ts`.
- **Operaciones**: `frontend/src/backend/apis/*.api.ts` define queries y mutations.
- **Validación**: Zod ajustado para campos opcionales/nullable que vienen desde GraphQL.

## 3) Autenticación y sesiones

- **JWT en cookies HttpOnly** sigue igual (el navegador adjunta cookies automáticamente).
- **Login/Register/Logout** son **mutations** GraphQL.
- **Session** se obtiene con `query session`.
- **wsTicket** (token efímero para WS) se obtiene con `query wsTicket`.
- **OAuth** sigue siendo REST por redirecciones y callbacks del proveedor.

## 4) Subida de archivos (uploads)

- Se utiliza el scalar **Upload** y el formato **multipart GraphQL**.
- El frontend envía `operations` + `map` + archivo (ver `files.api.ts`).
- El backend usa `graphql-upload` y mapea el archivo a `Express.Multer.File`.
- Para evitar bloqueos CSRF en Apollo, se incluye el header `apollo-require-preflight`.

## 5) Pasos de la migración (resumen)

1. **Configurar GraphQLModule** con `autoSchemaFile` y resolver de `Upload`.
2. **Reemplazar controllers** por **resolvers** (queries/mutations).
3. **Anotar DTOs/Entities** con `@ObjectType`, `@InputType` y `@Field`.
4. **Adaptar guards/interceptors/filters** a contexto GraphQL.
5. **Actualizar frontend**: llamadas HTTP -> queries/mutations.
6. **Ajustar validaciones** para campos `null`/opcionales.
7. **Mantener REST** solo para OAuth y verificación de email.

## 6) Beneficios principales

- **Menos endpoints** y contrato único.
- **Evita overfetch/underfetch**: el cliente pide solo lo necesario.
- **Tipado fuerte** y **autodocumentación** con el schema.
- **Evolución más segura**: cambios explícitos en el schema.
- **Mejor mantenimiento**: resolvers organizados por dominio.

## 7) Consideraciones prácticas

- Los campos opcionales pueden venir como `null` en GraphQL; el frontend debe aceptarlo.
- Los errores GraphQL llegan en `errors[]`; el cliente los normaliza a errores HTTP.
- El Gateway WebSocket sigue independiente del API GraphQL.
