# 🚀 Guía de Despliegue en VPS

Esta guía te explica cómo desplegar tu backend de Airbnb en un VPS (servidor privado virtual).

## 📋 Prerrequisitos

1. **VPS con:**
   - Ubuntu 20.04+ / Debian 11+ (recomendado)
   - Docker y Docker Compose instalados
   - Al menos 1GB de RAM
   - Acceso SSH

2. **Dominio configurado** (opcional pero recomendado)

3. **Variables de producción listas:**
   - MongoDB URI (MongoDB Atlas o servidor propio)
   - JWT Secret fuerte
   - API Keys de servicios (Resend, etc.)

---

## 🔧 Paso 1: Preparar el VPS

### 1.1. Conectar al VPS por SSH

```bash
ssh usuario@tu-servidor.com
```

### 1.2. Instalar Docker (si no está instalado)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Añadir usuario al grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Reiniciar sesión para aplicar cambios
exit
# Volver a conectar por SSH
```

### 1.3. Verificar instalación

```bash
docker --version
docker compose version
```

---

## 📦 Paso 2: Subir el código al VPS

### Opción A: Usando Git (Recomendado)

```bash
# En el VPS
cd ~
git clone https://github.com/tu-usuario/airbnb-backend.git
cd airbnb-backend
```

### Opción B: Usando SCP (transferencia directa)

```bash
# En tu máquina local
scp -r ./airbnb-backend usuario@tu-servidor.com:~/
```

---

## 🔐 Paso 3: Configurar Variables de Entorno

### 3.1. Crear archivo de producción

```bash
# En el VPS, dentro de la carpeta del proyecto
cd ~/airbnb-backend

# Copiar ejemplo
cp .env.production.example .env.production

# Editar con nano o vim
nano .env.production
```

### 3.2. Configurar valores reales

Reemplaza TODOS los valores de ejemplo:

```env
NODE_ENV=production
PORT=3333

# Genera un secreto fuerte:
# En tu terminal: openssl rand -base64 32
JWT_SECRET=tu_secreto_super_seguro_generado_con_openssl
JWT_EXPIRES_IN=7d

# MongoDB Atlas o tu servidor
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/airbnb_prod?retryWrites=true&w=majority

# Tu dominio frontend real
FRONTEND_ORIGIN=https://tu-app-frontend.com

# API Keys reales
RESEND_API_KEY=re_tu_api_key_real
RESEND_FROM_EMAIL=noreply@tu-dominio.com
```

Guarda con `Ctrl+O`, `Enter`, y sal con `Ctrl+X`.

---

## 🏗️ Paso 4: Construir y Desplegar

### Opción A: Usando el script automático

```bash
# Dar permisos de ejecución
chmod +x deploy-vps.sh

# Ejecutar despliegue
./deploy-vps.sh
```

### Opción B: Manualmente

```bash
# 1. Construir imagen (con Dockerfile de producción)
docker build -f Dockerfile.production -t adribnb-backend:latest .

# 2. Detener contenedor anterior si existe
docker stop airbnb-api 2>/dev/null || true
docker rm airbnb-api 2>/dev/null || true

# 3. Iniciar contenedor con variables de .env.production
docker run -d \
  --name airbnb-api \
  --restart unless-stopped \
  -p 3333:3333 \
  --env-file .env.production \
  adribnb-backend:latest

# 4. Ver logs
docker logs -f airbnb-api
```

---

## ✅ Paso 5: Verificar Despliegue

### 5.1. Verificar que el contenedor está corriendo

```bash
docker ps
```

Deberías ver `airbnb-api` en estado "Up".

### 5.2. Probar endpoints

```bash
# Desde el VPS
curl http://localhost:3333/health
# Respuesta esperada: {"ok":true}

curl http://localhost:3333/api/info
# Respuesta esperada: {"version":"1.0.0",...}
```

### 5.3. Ver logs en tiempo real

```bash
docker logs -f airbnb-api
```

---

## 🌐 Paso 6: Exponer al Mundo (Configurar Nginx)

### 6.1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 6.2. Configurar reverse proxy

```bash
sudo nano /etc/nginx/sites-available/airbnb-api
```

Pega esta configuración:

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;  # Cambia esto

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3. Activar configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/airbnb-api /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 6.4. Configurar SSL con Let's Encrypt (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d api.tu-dominio.com

# Certbot configurará automáticamente HTTPS
```

---

## 🔄 Comandos Útiles de Mantenimiento

```bash
# Ver logs en tiempo real
docker logs -f airbnb-api

# Ver estadísticas (CPU, RAM)
docker stats airbnb-api

# Reiniciar contenedor
docker restart airbnb-api

# Detener contenedor
docker stop airbnb-api

# Iniciar contenedor detenido
docker start airbnb-api

# Ver contenedores activos
docker ps

# Ver todos los contenedores (incluso detenidos)
docker ps -a

# Eliminar contenedor
docker stop airbnb-api
docker rm airbnb-api

# Eliminar imagen
docker rmi adribnb-backend:latest

# Limpiar recursos no usados
docker system prune -a
```

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# 1. Conectar al VPS
ssh usuario@tu-servidor.com

# 2. Ir a la carpeta del proyecto
cd ~/airbnb-backend

# 3. Obtener últimos cambios (si usas Git)
git pull origin main

# 4. Reconstruir y redesplegar
./deploy-vps.sh

# O manualmente:
docker build -f Dockerfile.production -t adribnb-backend:latest .
docker stop airbnb-api
docker rm airbnb-api
docker run -d --name airbnb-api --restart unless-stopped -p 3333:3333 --env-file .env.production adribnb-backend:latest
```

---

## 🐛 Solución de Problemas

### Problema: "Permission denied" al construir

**Solución:** Ya está arreglado en `Dockerfile.production` con:
```dockerfile
RUN chmod -R +x node_modules/.bin 2>/dev/null || true
```

### Problema: El contenedor se detiene inmediatamente

```bash
# Ver logs de error
docker logs airbnb-api

# Causas comunes:
# 1. Falta una variable de entorno requerida
# 2. No puede conectar a MongoDB
# 3. Puerto 3333 ya está en uso
```

### Problema: No puede conectar a MongoDB

1. Verifica que la URI sea correcta en `.env.production`
2. Asegúrate de que tu IP del VPS esté en la whitelist de MongoDB Atlas
3. Prueba la conexión manualmente:
   ```bash
   docker exec -it airbnb-api node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('OK')).catch(console.error)"
   ```

### Problema: Puerto 3333 ya está en uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3333

# O cambiar el puerto en .env.production
PORT=8080

# Y en docker run:
docker run -d --name airbnb-api -p 8080:8080 --env-file .env.production adribnb-backend:latest
```

---

## 🔒 Seguridad - Checklist

- [ ] `.env.production` NO está en el repositorio Git
- [ ] `JWT_SECRET` es fuerte (32+ caracteres, generado con `openssl rand -base64 32`)
- [ ] MongoDB tiene autenticación habilitada
- [ ] IP whitelist configurada en MongoDB Atlas
- [ ] HTTPS configurado (Let's Encrypt)
- [ ] Firewall configurado (solo puertos 80, 443, 22 abiertos)
- [ ] SSH con key authentication (no password)
- [ ] Contenedor corre como usuario `node` (no root)

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
docker stats airbnb-api
```

### Configurar alertas (opcional)

Puedes usar servicios como:
- UptimeRobot (monitoreo gratuito)
- Datadog
- New Relic
- PM2 (si no usas Docker)

---

## 🎉 ¡Listo!

Tu API debería estar funcionando en:
- Local (VPS): `http://localhost:3333`
- Internet: `https://api.tu-dominio.com`

Prueba desde cualquier lugar:
```bash
curl https://api.tu-dominio.com/health
```

¿Necesitas ayuda? Revisa los logs: `docker logs -f airbnb-api`
