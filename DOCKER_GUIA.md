# Guía Docker - Airbnb Backend

## 🐳 Dockerfile Configurado

- **Node.js**: 22.22
- **npm**: 10.9 (incluido en Node 22.22)
- **Image base**: `node:22.22-alpine` (ligera y segura)
- **Comando**: `npm run start` (ejecuta `node dist/server.js`)

---

## 🚀 Uso Rápido

### 1. Build de la imagen
```bash
docker build -t airbnb-backend .
```

### 2. Ejecutar el contenedor
```bash
docker run -p 3333:3333 \
  -e MONGO_URI="tu_mongo_uri" \
  -e JWT_SECRET="tu_secret" \
  airbnb-backend
```

### 3. Con Docker Compose (Recomendado)
```bash
# Levantar todo (backend + MongoDB)
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down
```

---

## 📦 Características del Dockerfile

### ✅ Optimizaciones
- **Multi-stage**: Compila TypeScript y elimina devDependencies
- **Alpine Linux**: Imagen base ligera (~50MB vs ~200MB)
- **Cache de npm**: Usa `npm ci` para builds reproducibles
- **Usuario no-root**: Mayor seguridad
- **Healthcheck**: Monitoreo automático del estado
- **dumb-init**: Manejo correcto de señales (SIGTERM)

### ✅ Seguridad
- Corre como usuario `node` (no root)
- No incluye archivos sensibles (.env, .git)
- Usa `.dockerignore` para excluir archivos innecesarios

### ✅ Producción Ready
- TypeScript compilado a JavaScript
- Solo dependencias de producción en la imagen final
- Healthcheck configurado
- Variables de entorno parametrizables

---

## 🔧 Variables de Entorno

### Método 1: Archivo .env para Docker Compose
Crea `.env.docker` en la raíz:

```bash
JWT_SECRET=tu_secret_super_seguro_aqui
MONGO_URI=mongodb://mongo:27017/airbnb
FRONTEND_ORIGIN=https://tu-frontend.com
RESEND_API_KEY=re_tu_api_key
RESEND_FROM_EMAIL=noreply@tudominio.com
```

Luego usa:
```bash
docker-compose --env-file .env.docker up
```

### Método 2: Variables en línea
```bash
docker run -p 3333:3333 \
  -e NODE_ENV=production \
  -e PORT=3333 \
  -e MONGO_URI="mongodb://tu-host:27017/airbnb" \
  -e JWT_SECRET="tu_secret_seguro" \
  -e JWT_EXPIRES_IN=7d \
  -e FRONTEND_ORIGIN="https://tu-frontend.com" \
  -e RESEND_API_KEY="re_tu_key" \
  -e RESEND_FROM_EMAIL="noreply@tudominio.com" \
  airbnb-backend
```

---

## 🛠️ Comandos Útiles

### Build
```bash
# Build normal
docker build -t airbnb-backend .

# Build sin cache
docker build --no-cache -t airbnb-backend .

# Build con tag de versión
docker build -t airbnb-backend:1.0.0 .
```

### Run
```bash
# Ejecutar en modo interactivo
docker run -it -p 3333:3333 airbnb-backend

# Ejecutar en background
docker run -d -p 3333:3333 --name airbnb-api airbnb-backend

# Con MongoDB externo
docker run -p 3333:3333 \
  -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/airbnb" \
  airbnb-backend
```

### Logs y Debug
```bash
# Ver logs
docker logs -f airbnb-api

# Entrar al contenedor
docker exec -it airbnb-api sh

# Ver estado
docker ps
docker inspect airbnb-api
```

### Limpieza
```bash
# Detener y eliminar contenedor
docker stop airbnb-api
docker rm airbnb-api

# Eliminar imagen
docker rmi airbnb-backend

# Limpiar todo Docker
docker system prune -a
```

---

## 🐳 Docker Compose (Producción)

El archivo `docker-compose.yml` incluye:
- ✅ Backend (API Node.js)
- ✅ MongoDB (base de datos)
- ✅ Network privada
- ✅ Volumen persistente para MongoDB
- ✅ Healthchecks automáticos
- ✅ Restart automático

### Comandos Docker Compose
```bash
# Levantar todo
docker-compose up -d

# Ver logs del backend
docker-compose logs -f app

# Ver logs de MongoDB
docker-compose logs -f mongo

# Reiniciar solo el backend
docker-compose restart app

# Escalar (múltiples instancias)
docker-compose up -d --scale app=3

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra la BD)
docker-compose down -v
```

---

## 📊 Tamaño de la Imagen

```bash
# Ver tamaño
docker images airbnb-backend

# Optimización esperada:
# - Con node:22.22        : ~200MB
# - Con node:22.22-alpine : ~80-120MB
```

---

## 🔍 Healthcheck

El Dockerfile incluye un healthcheck que verifica:
- ✅ Endpoint `/health` responde 200 OK
- ✅ Intervalo: cada 30 segundos
- ✅ Timeout: 3 segundos
- ✅ Reintentos: 3 veces antes de marcar como unhealthy

Ver estado:
```bash
docker ps  # Columna STATUS muestra (healthy)
docker inspect airbnb-api | grep -A 10 Health
```

---

## 🚀 Deployment en Producción

### Opción 1: Docker Hub
```bash
# Login
docker login

# Tag
docker tag airbnb-backend tuusuario/airbnb-backend:1.0.0

# Push
docker push tuusuario/airbnb-backend:1.0.0

# En servidor de producción
docker pull tuusuario/airbnb-backend:1.0.0
docker run -p 3333:3333 tuusuario/airbnb-backend:1.0.0
```

### Opción 2: Fly.io
```bash
fly launch
fly deploy
```

### Opción 3: Railway
```bash
# Conecta tu repo GitHub
# Railway detecta el Dockerfile automáticamente
```

### Opción 4: DigitalOcean App Platform
```bash
# Sube el código
# Selecciona Dockerfile
# Configura variables de entorno
```

---

## 🐛 Troubleshooting

### Error: Cannot connect to MongoDB
```bash
# Verifica que MongoDB esté corriendo
docker-compose logs mongo

# Verifica la URI
docker exec -it airbnb-api env | grep MONGO
```

### Error: Port already in use
```bash
# Cambia el puerto host
docker run -p 8080:3333 airbnb-backend

# O mata el proceso en 3333
lsof -ti:3333 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :3333  # Windows
```

### Error: TypeScript compilation failed
```bash
# Verifica que se copien los archivos .ts
docker build --progress=plain -t airbnb-backend .
```

### La imagen es muy grande
```bash
# Usa alpine
FROM node:22.22-alpine

# Limpia cache de npm
RUN npm cache clean --force
```

---

## 📋 Checklist Pre-Deployment

- [ ] Dockerfile construye correctamente
- [ ] .dockerignore excluye archivos sensibles
- [ ] Variables de entorno configuradas
- [ ] Healthcheck funciona: `curl http://localhost:3333/health`
- [ ] MongoDB conecta correctamente
- [ ] CORS configurado para tu dominio
- [ ] JWT_SECRET es seguro (no `change_me`)
- [ ] Logs del contenedor no muestran errores
- [ ] La API responde: `curl http://localhost:3333/`

---

## 🎯 Próximos Pasos

1. **Build local**: `docker build -t airbnb-backend .`
2. **Test local**: `docker-compose up`
3. **Verifica**: http://localhost:3333
4. **Push a registry**: Docker Hub / GitHub Container Registry
5. **Deploy**: Fly.io / Railway / DigitalOcean

---

## 📚 Recursos

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
