# Colección Postman — Airbnb Backend API

## Importar en Postman

1. Abre Postman.
2. **Import** → **File** → selecciona `Airbnb-Backend-API.postman_collection.json`.
3. La colección aparecerá en el panel izquierdo con todas las carpetas (Health & Info, Auth, Users, Properties, etc.).

## Variables de colección

- **baseUrl**: `http://localhost:3333` (cámbialo si tu servidor usa otro puerto).
- **accessToken**: se rellena automáticamente al ejecutar **Login** o **Signup** (script en la pestaña Tests de esas peticiones). Para el resto de peticiones que requieren Bearer, se usa esta variable.

Puedes editar variables en la colección: clic derecho sobre la colección → **Edit** → pestaña **Variables**.

## Uso rápido

1. Arranca el backend (`npm run dev`).
2. (Opcional) Ejecuta **POST /api/dev/seed** para cargar datos de ejemplo.
3. Ejecuta **Auth → Login** (o Signup) con un usuario existente; el token se guardará en `accessToken`.
4. Prueba cualquier otra petición; las que requieren auth usarán `Bearer {{accessToken}}`.

Para rutas con `:id` o `:propertyId`, sustituye en la URL (o define variables de entorno/request) por IDs reales obtenidos de listados (por ejemplo de GET /api/properties o GET /api/bookings).

## Documentación

Referencia completa de endpoints y ejemplos: [../API-REFERENCE.md](../API-REFERENCE.md).
