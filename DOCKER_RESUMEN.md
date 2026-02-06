# 🐳 Resumen: Docker para Airbnb Backend

## ✅ Archivos Creados

```
airbnb-backend/
├── Dockerfile              # Imagen Docker optimizada (Node 22.22 + npm 10.9)
├── .dockerignore          # Archivos excluidos del build
├── docker-compose.yml     # Backend + MongoDB en contenedores
├── .env.docker            # Variables de entorno para Docker
└── DOCKER_GUIA.md         # Guía completa de uso
```

---

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Build de la imagen
```bash
docker build -t airbnb-backend .
```
**Tiempo estimado**: 1-3 minutos (primera vez)

### 2️⃣ Levantar todo (Backend + MongoDB)
```bash
docker-compose up -d
```

### 3️⃣ Verificar que funciona
```bash
curl http://localhost:3333/health
# Respuesta esperada: {"ok":true}
```

✅ **Listo, tu API está corriendo en** `http://localhost:3333`

---

## 📦 ¿Qué incluye el Dockerfile?

### Características principales:
✅ **Node.js 22.22** con **npm 10.9**  
✅ Compila TypeScript automáticamente  
✅ Ejecuta `npm run start` (node dist/server.js)  
✅ Imagen ligera Alpine Linux (~80-120MB)  
✅ Healthcheck automático en `/health`  
✅ Usuario no-root (seguridad)  
✅ Optimizado para producción  

### Proceso de build:
```
1. Instala dependencias → npm ci
2. Copia código fuente → COPY . .
3. Compila TypeScript → npm run build
4. Elimina devDependencies → npm prune --production
5. Expone puerto 3333
6. Ejecuta: node dist/server.js
```

---

## 🐳 Docker Compose (Recomendado)

El `docker-compose.yml` levanta:

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| **app** | airbnb-backend | 3333 | Backend API Node.js |
| **mongo** | mongo:7 | 27017 | Base de datos MongoDB |

### Comandos esenciales:
```bash
# Levantar
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down

# Reiniciar backend
docker-compose restart app
```

---

## ⚙️ Variables de Entorno

Configura en `.env.docker`:

```bash
# Obligatorios
JWT_SECRET=tu_secret_super_seguro
MONGO_URI=mongodb://mongo:27017/airbnb

# Opcionales
PORT=3333
FRONTEND_ORIGIN=http://localhost:3000
RESEND_API_KEY=re_tu_key
```

Luego:
```bash
docker-compose --env-file .env.docker up
```

---

## 🧪 Testing Local

### Método 1: Con Docker Compose (más fácil)
```bash
docker-compose up -d
curl http://localhost:3333/
curl http://localhost:3333/health
curl http://localhost:3333/api/properties
```

### Método 2: Solo backend (sin MongoDB)
```bash
docker run -p 3333:3333 \
  -e USE_MEMORY_ONLY=true \
  -e JWT_SECRET=test123 \
  airbnb-backend

curl http://localhost:3333/health
```

---

## 🔍 Verificación

### Checklist de funcionamiento:
```bash
# 1. Imagen construida
docker images | grep airbnb-backend

# 2. Contenedores corriendo
docker ps

# 3. Logs sin errores
docker-compose logs app | tail -20

# 4. Health check OK
curl http://localhost:3333/health
# Respuesta: {"ok":true}

# 5. MongoDB conectado
docker-compose logs app | grep "Persistencia: MongoDB"

# 6. API responde
curl http://localhost:3333/
# Respuesta: {"message":"🚀 Airbnb Backend API funcionando",...}
```

---

## 🚀 Deploy en Producción

### Opción 1: Fly.io (Gratis)
```bash
fly launch
fly deploy
fly open
```

### Opción 2: Railway (Gratis)
1. Conecta GitHub
2. Railway detecta Dockerfile
3. Añade MongoDB addon
4. Deploy automático

### Opción 3: DigitalOcean
1. App Platform → New App
2. GitHub repo
3. Detect Dockerfile
4. Configure env vars
5. Deploy

### Opción 4: Docker Hub + VPS
```bash
# Build y push
docker build -t tuusuario/airbnb-backend .
docker push tuusuario/airbnb-backend

# En el servidor
docker pull tuusuario/airbnb-backend
docker run -d -p 3333:3333 tuusuario/airbnb-backend
```

---

## 🐛 Troubleshooting Rápido

### Error: "Cannot connect to MongoDB"
```bash
# Verifica que mongo esté corriendo
docker-compose ps mongo
docker-compose logs mongo

# Reinicia MongoDB
docker-compose restart mongo
```

### Error: "Port 3333 already in use"
```bash
# Windows
netstat -ano | findstr :3333
taskkill /PID <PID> /F

# Cambiar puerto
docker-compose down
# Edita docker-compose.yml: "8080:3333"
docker-compose up -d
```

### Error al compilar TypeScript
```bash
# Build sin cache
docker build --no-cache -t airbnb-backend .

# Ver logs detallados
docker build --progress=plain -t airbnb-backend .
```

### Imagen muy grande (>200MB)
```bash
# Ya usa Alpine (optimizado)
# Para reducir más:
docker build -t airbnb-backend .
docker run --rm airbnb-backend du -sh /app
```

---

## 📊 Tamaño Esperado

```bash
docker images airbnb-backend

# Esperado:
# airbnb-backend    latest    abc123    80-120 MB
```

**Optimización aplicada**:
- ✅ Base Alpine (vs Ubuntu): -70% tamaño
- ✅ npm prune --production: -30% dependencias
- ✅ .dockerignore: excluye archivos innecesarios

---

## 🎯 Próximos Pasos

1. **Prueba local**:
   ```bash
   docker-compose up
   # Abre http://localhost:3333
   ```

2. **Verifica funcionamiento**:
   - Health: http://localhost:3333/health
   - Info: http://localhost:3333/api/info
   - Properties: http://localhost:3333/api/properties

3. **Push a repositorio**:
   ```bash
   git add Dockerfile .dockerignore docker-compose.yml
   git commit -m "Add Docker configuration"
   git push
   ```

4. **Deploy** (elige uno):
   - Fly.io: `fly launch`
   - Railway: conecta repo
   - DigitalOcean: App Platform
   - Docker Hub: `docker push`

---

## 💡 Tips

### Desarrollo local
```bash
# Usa nodemon (watch mode)
npm run dev

# Docker solo para testing/producción
docker-compose up
```

### Producción
```bash
# Siempre usa variables seguras
JWT_SECRET=<valor_aleatorio_64_caracteres>

# Conecta MongoDB Atlas
MONGO_URI=mongodb+srv://...

# Configura CORS
FRONTEND_ORIGIN=https://tu-dominio.com
```

### Performance
```bash
# Limita recursos del contenedor
docker run -m 512M --cpus=0.5 airbnb-backend

# Ver uso de recursos
docker stats
```

---

## 📚 Documentación Completa

Ver **DOCKER_GUIA.md** para:
- Comandos avanzados
- Debugging detallado
- Configuración CI/CD
- Monitoreo con healthchecks
- Escalabilidad horizontal

---

## ✅ Estado Actual

🟢 **Dockerfile**: Listo y optimizado  
🟢 **Docker Compose**: Backend + MongoDB configurado  
🟢 **.dockerignore**: Optimizado para builds rápidos  
🟢 **Healthcheck**: Configurado en `/health`  
🟢 **Documentación**: Completa (DOCKER_GUIA.md)  

**Tu aplicación está lista para contenedores Docker** 🎉
