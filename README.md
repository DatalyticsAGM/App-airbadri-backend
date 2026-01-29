# Airbnb Backend (Milestone 1)

Backend mínimo para soportar el frontend: autenticación (signup/login/me/logout) y recuperación/reset de contraseña con token.

## Requisitos
- Node.js
- MongoDB (local o remoto)

## Setup
1) Instalar dependencias

2) Crear `.env` basado en `.env.example`

3) Levantar en desarrollo
- `npm run dev`

## Base URL
- `http://localhost:3333`
- API: `http://localhost:3333/api`

## Endpoints (Auth)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/logout` (Bearer token)
- `POST /api/auth/forgot-password`
- `GET /api/auth/reset-password/validate?token=...`
- `POST /api/auth/reset-password`
