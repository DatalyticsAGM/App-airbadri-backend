# 🔧 Fix: Error "Falta JWT_SECRET en el entorno"

## 🔴 Error

```
dotenv@17.2.3] injecting env (0) from .env
Error fatal al iniciar el servidor: Error: Falta JWT_SECRET en el entorno
```

## 🎯 Causa

Docker **NO copia** el archivo `.env` al contenedor (por seguridad, está en `.dockerignore`).
Las variables de entorno deben pasarse explícitamente al contenedor.

---

## ✅ Soluciones

### Solución 1: Docker Compose (Recomendado ⭐)

Las variables ya están configuradas en `docker-compose.yml`:

```bash
# Detener contenedores previos
docker-compose down

# Levantar con las variables configuradas
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

**Las variables están en el archivo**, no necesitas hacer nada más.

---

### Solución 2: Script Automático

Usa el script de inicio:

```bash
# En Git Bash / Linux / Mac
bash docker-start.sh

# En Windows (PowerShell)
.\docker-start.sh
```

---

### Solución 3: Docker Run con Variables

Si usas `docker run` directamente:

```bash
docker run -d -p 3333:3333 \
  -e NODE_ENV=production \
  -e PORT=3333 \
  -e JWT_SECRET=dev_secret_change_in_production_12345678 \
  -e JWT_EXPIRES_IN=7d \
  -e MONGO_URI=mongodb://host.docker.internal:27017/airbnb \
  -e FRONTEND_ORIGIN=http://localhost:3000 \
  -e RESEND_API_KEY=re_EBC2buMx_81x53QpPRczzcLfcVpeWfQEk \
  -e RESEND_FROM_EMAIL=onboarding@resend.dev \
  --name airbnb-api \
  airbnb-backend
```

---

### Solución 4: Usar archivo .env.docker

```bash
# Opción A: Con Docker Compose
docker-compose --env-file .env.docker up -d

# Opción B: Con Docker Run
docker run -d -p 3333:3333 \
  --env-file .env.docker \
  --name airbnb-api \
  airbnb-backend
```

---

## 🧪 Verificación

Después de levantar el contenedor:

```bash
# 1. Ver logs
docker-compose logs app | head -20

# Deberías ver:
# ✓ dotenv@17.2.3] injecting env (6-8) from .env
# ✓ API lista en http://localhost:3333
# ✓ Persistencia: MongoDB

# 2. Probar health
curl http://localhost:3333/health
# Esperado: {"ok":true}

# 3. Ver info
curl http://localhost:3333/api/info
# Esperado: {"version":"1.0.0","memoryOnly":false,"env":"production"}
```

---

## 📋 Checklist de Variables Requeridas

El backend necesita estas variables **obligatorias**:

- ✅ `JWT_SECRET` - Para firmar tokens (ya configurado: `dev_secret_change_in_production_12345678`)
- ✅ `MONGO_URI` - Base de datos (ya configurado: `mongodb://mongo:27017/airbnb`)

Variables **opcionales** (ya tienen defaults):
- `PORT` - Puerto del servidor (default: 3333)
- `JWT_EXPIRES_IN` - Caducidad del token (default: 7d)
- `FRONTEND_ORIGIN` - CORS (default: permite todos)
- `RESEND_API_KEY` - Para emails (opcional)
- `NODE_ENV` - Entorno (default: development)

---

## 🐛 Troubleshooting

### Aún da error después de docker-compose up

```bash
# 1. Detén todo
docker-compose down

# 2. Borra la imagen vieja
docker rmi airbnb-backend-app

# 3. Rebuild desde cero
docker-compose build --no-cache

# 4. Levanta de nuevo
docker-compose up -d

# 5. Ver logs en tiempo real
docker-compose logs -f app
```

### Ver qué variables tiene el contenedor

```bash
# Método 1: Con docker exec
docker exec airbnb-backend env | grep JWT_SECRET

# Método 2: Con docker inspect
docker inspect airbnb-backend | grep JWT_SECRET

# Deberías ver:
# JWT_SECRET=dev_secret_change_in_production_12345678
```

### MongoDB no conecta

```bash
# 1. Verifica que mongo esté corriendo
docker-compose ps mongo

# 2. Ver logs de mongo
docker-compose logs mongo

# 3. Si no está corriendo, levántalo
docker-compose up -d mongo

# 4. Reinicia el backend
docker-compose restart app
```

---

## 🎯 Comando Completo (Todo en Uno)

```bash
# Limpia, reconstruye y levanta todo
docker-compose down && \
docker-compose build --no-cache && \
docker-compose up -d && \
sleep 5 && \
curl http://localhost:3333/health
```

Deberías ver:
```json
{"ok":true}
```

---

## 💡 Para Producción

En producción, **NUNCA** uses valores hardcoded. Usa variables de entorno del servidor:

```bash
# Ejemplo en servidor de producción
export JWT_SECRET="un-secret-super-seguro-aleatorio-64-caracteres-aqui"
export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/airbnb"
export FRONTEND_ORIGIN="https://tu-dominio.com"

docker-compose up -d
```

O configura las variables en tu plataforma:
- **Fly.io**: `fly secrets set JWT_SECRET=xxx`
- **Railway**: Variables de entorno en dashboard
- **DigitalOcean**: App Platform > Environment Variables

---

## ✅ Resumen

**Problema**: `.env` no se copia al contenedor  
**Solución**: Usar `docker-compose.yml` con variables configuradas  
**Comando**: `docker-compose up -d`  
**Verificar**: `curl http://localhost:3333/health`  

Las variables YA están configuradas en tu `docker-compose.yml`, solo ejecuta:

```bash
docker-compose up -d
```

¡Listo! 🎉
