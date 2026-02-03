# Documentación de la API — Plan ejecutado

Este documento describe el trabajo realizado para tener una documentación amplia de todos los endpoints y una colección Postman importable.

## Objetivos cumplidos

1. **Documentación amplia** de todos los endpoints con convenciones, parámetros, cuerpos, respuestas y ejemplos.
2. **Colección Postman** lista para importar, con variables y script de login para guardar el token.

## Entregables

| Entregable | Ubicación | Descripción |
|------------|-----------|-------------|
| Referencia API completa | [API-REFERENCE.md](./API-REFERENCE.md) | Convenciones, índice de endpoints, detalle por recurso (query, body, respuestas), ejemplos request/response y flujos (checkout, registro, recuperar contraseña). |
| Resumen rápido | [API.md](./API.md) | Tablas por recurso (actualizado con DELETE /api/users/me y POST /api/notifications). Enlace a la referencia ampliada y a la colección Postman. |
| Colección Postman | [postman/Airbnb-Backend-API.postman_collection.json](./postman/Airbnb-Backend-API.postman_collection.json) | Colección v2.1 con todas las rutas organizadas en carpetas. Variables: `baseUrl`, `accessToken`. Script en Login/Signup para guardar el token. |
| Uso de Postman | [postman/README.md](./postman/README.md) | Cómo importar, variables y uso rápido. |

## Plan de trabajo ejecutado

1. **Inventario y gaps**  
   Revisión de `src/routes/*` y `src/app.ts` para listar todos los endpoints. Completado en API.md y API-REFERENCE.md (DELETE /api/users/me, POST /api/notifications con body).

2. **Convenciones**  
   Base URL, autenticación Bearer, formato de errores y códigos HTTP documentados al inicio de API-REFERENCE.md.

3. **Documentación por recurso**  
   Para cada grupo (Health, Dev, Auth, Users, Properties, Bookings, Reviews, Favorites, Notifications, Host, Search): método, ruta, auth, query params, body, respuesta 2xx y errores típicos.

4. **Ejemplos request/response**  
   Ejemplos en API-REFERENCE.md (curl y JSON) por tipo de endpoint; en Postman, bodies de ejemplo en cada request.

5. **Colección Postman**  
   Una carpeta por recurso y una request por endpoint; URLs con `{{baseUrl}}`; requests con auth con `Authorization: Bearer {{accessToken}}`; bodies raw JSON donde aplica.

6. **Variables y script de login**  
   Variables de colección: `baseUrl` (http://localhost:3333), `accessToken` (vacío). En las requests **Login**, **Signup** y **Register** se añadió un script en Tests que guarda `pm.response.json().accessToken` en `pm.collectionVariables.set('accessToken', ...)`.

## Cómo usar

- **Solo leer la API:** [API-REFERENCE.md](./API-REFERENCE.md).
- **Probar en Postman:** importar [postman/Airbnb-Backend-API.postman_collection.json](./postman/Airbnb-Backend-API.postman_collection.json) y seguir [postman/README.md](./postman/README.md).
