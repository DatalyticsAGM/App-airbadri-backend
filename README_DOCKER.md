# 🐳 Docker - Airbnb Backend

## ✅ Estado Actual: FUNCIONANDO

```
✓ Backend:  http://localhost:3333 (healthy)
✓ MongoDB:  mongodb://localhost:27017 (healthy)
✓ Endpoints: Todos respondiendo 200 OK
```

---

## 🚀 Inicio Rápido (2 comandos)

```bash
# 1. Levantar todo (primera vez tarda 2-3 min)
docker-compose up -d

# 2. Verificar
curl http://localhost:3333/health
```

**¡Listo!** Tu API está en `http://localhost:3333`

---

## 📦 ¿Qué incluye?

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Backend** | 3333 | API Node.js + Express + TypeScript |
| **MongoDB** | 27017 | Base de datos persistente |

---

## 🎯 Comandos Esenciales

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down

# Reiniciar backend
docker-compose restart app

# Ver estado
docker-compose ps
```

---

## 🔧 El Error que Tenías (Resuelto)

### ❌ Error:
```
Error: Falta JWT_SECRET en el entorno
```

### ✅ Solución Aplicada:
Las variables de entorno están **hardcoded en `docker-compose.yml`**:

```yaml
environment:
  JWT_SECRET: dev_secret_change_in_production_12345678
  MONGO_URI: mongodb://mongo:27017/airbnb
  # ... más variables
```

**Por eso ahora funciona** sin necesidad de archivo `.env`.

---

## 🧪 Verificación

### Todos los endpoints funcionando:

```bash
# Health
curl http://localhost:3333/health
# → {"ok":true}

# Info
curl http://localhost:3333/api/info
# → {"version":"1.0.0","memoryOnly":false,"env":"production"}

# Properties
curl http://localhost:3333/api/properties
# → {"items":[],"page":1,"limit":20,"total":0}

# Login
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"administrador@example.com","password":"123456"}'
# → {"user":{...},"accessToken":"..."}
```

---

## 📊 Estructura de Contenedores

```
┌─────────────────────────────────┐
│   airbnb-backend (Node 22.22)   │
│   Puerto: 3333                   │
│   Status: healthy ✓              │
└────────────┬────────────────────┘
             │
             │ Se conecta a
             ↓
┌─────────────────────────────────┐
│   airbnb-mongo (MongoDB 7)      │
│   Puerto: 27017                  │
│   Status: healthy ✓              │
│   Volumen: mongo-data (persist.) │
└─────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Si el backend no arranca

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Buscar errores
docker-compose logs app | grep -i error
```

### Si MongoDB no conecta

```bash
# Verificar que mongo esté corriendo
docker-compose ps mongo

# Ver logs de MongoDB
docker-compose logs mongo

# Reiniciar MongoDB
docker-compose restart mongo
```

### Empezar de cero

```bash
# Detener y eliminar TODO (⚠️ borra la base de datos)
docker-compose down -v

# Rebuild sin cache
docker-compose build --no-cache

# Levantar de nuevo
docker-compose up -d
```

---

## 🌐 URLs Disponibles

### Backend:
- **Root**: http://localhost:3333
- **Health**: http://localhost:3333/health
- **Ready**: http://localhost:3333/ready
- **Info**: http://localhost:3333/api/info
- **Properties**: http://localhost:3333/api/properties
- **Auth Login**: http://localhost:3333/api/auth/login

### MongoDB:
- **URI**: mongodb://localhost:27017/airbnb
- **Compass**: Conectar con la URI de arriba

---

## 🔑 Variables de Entorno Configuradas

Ya están en `docker-compose.yml`:

```yaml
✅ JWT_SECRET: dev_secret_change_in_production_12345678
✅ MONGO_URI: mongodb://mongo:27017/airbnb
✅ PORT: 3333
✅ NODE_ENV: production
✅ FRONTEND_ORIGIN: http://localhost:3000
✅ RESEND_API_KEY: re_EBC2buMx_81x53QpPRczzcLfcVpeWfQEk
```

---

## 📚 Documentación Completa

- **README_DOCKER.md** - Esta guía (inicio rápido)
- **DOCKER_GUIA.md** - Guía completa con deployment
- **DOCKER_FIX.md** - Solución al error de variables
- **docker-start.sh** - Script automático de inicio

---

## 🎯 Próximos Pasos

### 1. Seed de datos (opcional)
```bash
# Opción A: Desde fuera del contenedor (con npm run dev local)
npm run seed:all:mongo

# Opción B: Desde dentro del contenedor
docker exec -it airbnb-backend npm run seed:interactive
```

### 2. Probar con Postman
- Importa: `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`
- Base URL: `http://localhost:3333`
- Ejecuta requests

### 3. Conectar Frontend
```typescript
const API_URL = 'http://localhost:3333'
```

---

## ✅ Resumen

🟢 **Docker Compose**: Funcionando  
🟢 **Backend**: http://localhost:3333 (healthy)  
🟢 **MongoDB**: mongodb://localhost:27017 (healthy)  
🟢 **Endpoints**: Todos respondiendo 200 OK  
🟢 **Variables**: Configuradas correctamente  

**Tu backend está corriendo en Docker exitosamente** 🎉

---

## 💡 Tips

### Desarrollo local (sin Docker)
```bash
npm run dev
```

### Producción (Docker)
```bash
docker-compose up -d
```

### Ver logs en tiempo real
```bash
docker-compose logs -f app
```

### Reiniciar después de cambios en código
```bash
docker-compose down
docker-compose build
docker-compose up -d
```
