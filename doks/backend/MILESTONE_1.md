# 🎯 Milestone 1 (Backend): Autenticación + Reset Password (API REST)

## 📋 Fuente de verdad

- Frontend: `doks/frontend/MILESTONE_1.md`
- Reglas: `.cursor/rules/No-dependencias.mdc` (dependencias mínimas; preferir Node/TS nativo; **NO conectar a MongoDB en M1**, usar mocks/in-memory)

## 🎯 Objetivo

Exponer una **API REST mínima** para soportar el Milestone 1 del Frontend:
- Registro (signup/register)
- Login
- Obtener usuario actual (me/verify)
- Logout (stateless)
- Flujo de recuperación de contraseña:
  - solicitar reset
  - validar token
  - resetear contraseña con token

## ✅ Principios / restricciones (importantes)

- **Sin dependencias nuevas** salvo necesidad real (ideal: ninguna).
- Persistencia **en memoria** (in-memory) en este milestone.
  - MongoDB **NO se usa** en M1 (aunque exista config/paquete), para avanzar rápido y sin sobreingeniería.
- Auth **stateless** con JWT:
  - El frontend guarda y borra el token.
- Respuestas de error consistentes:
  - `{"error": {"code": "SOME_CODE", "message": "..."}}`

---

## 🧩 Milestone 1 — Tareas (máximo 5)

### 1) Infraestructura base + estructura MVC (mínima)
**Alcance**
- Inicializar Express + middlewares esenciales (JSON, CORS).
- Estructura clara MVC (routes/controllers/services/store).
- Manejo de errores consistente y 404 simple.

**Criterios de aceptación**
- `GET /health` responde `{ ok: true }`.
- Errores devuelven `{ error: { code, message } }`.

---

### 2) Auth: Signup/Login + JWT
**Alcance**
- Endpoints para registro y login.
- Hash de password y verificación.
- Emitir `accessToken` (JWT) en signup/login.

**Criterios de aceptación**
- `POST /api/auth/signup` crea usuario y devuelve `{ user, accessToken }`.
- `POST /api/auth/login` valida credenciales y devuelve `{ user, accessToken }`.
- Email único (409 si ya existe).

---

### 3) Auth: `me/verify` + middleware `requireAuth`
**Alcance**
- Middleware `requireAuth` que:
  - lee `Authorization: Bearer <token>`
  - valida token
  - expone `userId` al request
- Endpoints para obtener el usuario actual:
  - `GET /api/auth/me`
  - `GET /api/auth/verify` (alias compatible)

**Criterios de aceptación**
- Sin token → 401 `UNAUTHORIZED`.
- Token inválido → 401 `UNAUTHORIZED`.
- Con token válido → devuelve `{ user }`.

---

### 4) Logout (stateless)
**Alcance**
- Endpoint `POST /api/auth/logout` protegido.
- No “revoca” tokens en backend (simple); el frontend borra el token.

**Criterios de aceptación**
- Con token válido responde 200 y un body simple (`{ ok: true }`).

---

### 5) Forgot/Reset Password con token
**Alcance**
- `POST /api/auth/forgot-password`: genera token de reset y una expiración.
  - En M1 no se envía email real; se devuelve el token en dev (para que el frontend pruebe el flujo).
- `GET /api/auth/reset-password/validate?token=...`: valida que el token existe y no expiró.
- `POST /api/auth/reset-password`: recibe `{ token, password }` y resetea password.

**Criterios de aceptación**
- Token inválido/expirado → 400/401 con código claro (ej. `INVALID_TOKEN`).
- Token válido → permite resetear y luego invalida el token (no se reutiliza).

---

## 🧱 Estructura de carpetas sugerida (backend)

Manteniendo el estilo actual en `src/`:

- `src/routes/`
  - `auth.routes.ts`
  - `index.ts`
- `src/controllers/`
  - `auth.controller.ts`
- `src/services/`
  - `auth.service.ts`
- `src/store/` (modo memoria)
  - `memoryUsers.ts`
- `src/middlewares/`
  - `auth.ts` (requireAuth)
  - `errorHandler.ts`
  - `asyncHandler.ts`
- `src/utils/`
  - `validation.ts`
- `src/config/`
  - `env.ts`
  - `dotenv.ts`

---

## 📦 Dependencias (mínimas) + justificación

> No se agregan dependencias nuevas para M1.

- **express**: API REST.
- **cors**: permitir llamadas desde el frontend en dev.
- **dotenv**: cargar `.env`.
- **jsonwebtoken**: JWT para auth stateless.
- **bcryptjs**: hash/verificación de password.
- **crypto (Node)**: ids/tokens (sin instalar `uuid`).

---

## 🔌 Endpoints clave (contratos simples)

### `POST /api/auth/signup` (alias: `/register`)
**Body**
```json
{ "fullName": "Ada Lovelace", "email": "ada@mail.com", "password": "123456" }
```
**201**
```json
{ "user": { "id": "u1", "fullName": "Ada Lovelace", "email": "ada@mail.com" }, "accessToken": "..." }
```
**409**
```json
{ "error": { "code": "EMAIL_IN_USE", "message": "Email already registered" } }
```

### `POST /api/auth/login`
**Body**
```json
{ "email": "ada@mail.com", "password": "123456" }
```
**200**
```json
{ "user": { "id": "u1", "fullName": "Ada Lovelace", "email": "ada@mail.com" }, "accessToken": "..." }
```

### `GET /api/auth/me` (Bearer)
**200**
```json
{ "user": { "id": "u1", "fullName": "Ada Lovelace", "email": "ada@mail.com" } }
```

### `GET /api/auth/verify` (Bearer)
Alias de `me` para compatibilidad.

### `POST /api/auth/logout` (Bearer)
**200**
```json
{ "ok": true }
```

### `POST /api/auth/forgot-password`
**Body**
```json
{ "email": "ada@mail.com" }
```
**200 (modo dev)**
```json
{ "ok": true, "resetToken": "..." }
```

### `GET /api/auth/reset-password/validate?token=...`
**200**
```json
{ "ok": true }
```

### `POST /api/auth/reset-password`
**Body**
```json
{ "token": "...", "password": "nueva123" }
```
**200**
```json
{ "ok": true }
```

---

## 🗺️ Mapeo: pantallas del Frontend → endpoints backend

> Referencia: `doks/frontend/MILESTONE_1.md`

- **Login** `app/auth/login/page.tsx`
  - `POST /api/auth/login`
- **Signup/Register** `app/auth/signup/page.tsx`
  - `POST /api/auth/signup` (o `/register`)
- **Header / sesión** `components/auth/auth-button.tsx`
  - Usa `accessToken` (frontend lo guarda)
  - `GET /api/auth/me` / `GET /api/auth/verify` para refrescar el usuario
  - `POST /api/auth/logout` (opcional; el frontend borra token)
- **Forgot password** `app/auth/forgot-password/page.tsx`
  - `POST /api/auth/forgot-password`
- **Reset password** `app/auth/reset-password/page.tsx`
  - `GET /api/auth/reset-password/validate?token=...`
  - `POST /api/auth/reset-password`

