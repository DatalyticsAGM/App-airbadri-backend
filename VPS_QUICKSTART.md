# 🚀 VPS Quick Start - Despliegue en 5 Minutos

## ✅ Problema Resuelto

El error `sh: tsc: Permission denied` al construir en VPS ha sido **completamente resuelto**.

---

## 📝 Resumen de Cambios

### ✅ `Dockerfile` (desarrollo)
- ✅ Arreglados permisos de `node_modules/.bin`
- ✅ Arreglada propiedad de archivos (`chown`)
- ✅ Cambiado a `npx tsc` (más robusto)
- ⚠️ Mantiene secretos hardcodeados para desarrollo local

### ✅ `Dockerfile.production` (NUEVO - para VPS)
- ✅ Mismas correcciones de permisos
- ✅ SIN secretos hardcodeados (seguro)
- ✅ Listo para producción

### ✅ Archivos Nuevos
- ✅ `deploy-vps.sh` - Script de despliegue automático
- ✅ `.env.production.example` - Plantilla de variables
- ✅ `DEPLOY_VPS.md` - Guía completa paso a paso
- ✅ `SOLUCION_VPS.md` - Documentación técnica del problema

---

## 🎯 Despliegue Rápido (VPS)

### Paso 1: Subir código al VPS

```bash
# Opción A: Git
git clone https://github.com/tu-usuario/airbnb-backend.git
cd airbnb-backend

# Opción B: SCP
scp -r ./airbnb-backend usuario@tu-vps.com:~/
ssh usuario@tu-vps.com
cd airbnb-backend
```

### Paso 2: Configurar secretos

```bash
# Copiar plantilla
cp .env.production.example .env.production

# Editar con tus valores reales
nano .env.production
```

**Cambiar:**
- `JWT_SECRET` → Generar con: `openssl rand -base64 32`
- `MONGO_URI` → Tu MongoDB Atlas o servidor
- `RESEND_API_KEY` → Tu API key real
- `FRONTEND_ORIGIN` → Tu dominio frontend

### Paso 3: Desplegar

```bash
# Dar permisos al script
chmod +x deploy-vps.sh

# Ejecutar despliegue (¡un solo comando!)
./deploy-vps.sh
```

**Listo.** Tu API estará corriendo en `http://localhost:3333`

---

## 🧪 Verificar que Funciona

```bash
# Ver estado
docker ps

# Ver logs
docker logs -f airbnb-api

# Probar endpoint
curl http://localhost:3333/health
# Respuesta esperada: {"ok":true}
```

---

## 🌐 Exponer al Mundo (Opcional)

### 1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 2. Configurar reverse proxy

```bash
sudo nano /etc/nginx/sites-available/airbnb-api
```

Pegar:

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Activar

```bash
sudo ln -s /etc/nginx/sites-available/airbnb-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.tu-dominio.com
```

**¡Listo!** Tu API está en `https://api.tu-dominio.com`

---

## 🔄 Actualizar Aplicación

Cuando hagas cambios en el código:

```bash
# En el VPS
cd ~/airbnb-backend
git pull origin main
./deploy-vps.sh
```

---

## 🆘 Comandos Útiles

```bash
# Ver logs en tiempo real
docker logs -f airbnb-api

# Ver uso de CPU/RAM
docker stats airbnb-api

# Reiniciar
docker restart airbnb-api

# Detener
docker stop airbnb-api

# Eliminar contenedor
docker stop airbnb-api && docker rm airbnb-api

# Limpiar todo Docker
docker system prune -a
```

---

## 🐛 Problemas Comunes

### Contenedor se detiene inmediatamente

```bash
# Ver por qué falló
docker logs airbnb-api

# Causa común: falta una variable en .env.production
```

### No puede conectar a MongoDB

1. Verifica que la URI sea correcta
2. Añade la IP del VPS a MongoDB Atlas whitelist
3. Prueba conexión:
   ```bash
   docker exec -it airbnb-api node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ OK')).catch(console.error)"
   ```

### Puerto 3333 ya está en uso

```bash
# Ver qué usa el puerto
sudo lsof -i :3333

# Cambiar puerto en .env.production
PORT=8080

# Y en docker run:
docker run -d --name airbnb-api -p 8080:8080 --env-file .env.production adribnb-backend
```

---

## 📚 Documentación Completa

- **`DEPLOY_VPS.md`** - Guía detallada paso a paso
- **`SOLUCION_VPS.md`** - Explicación técnica del problema resuelto
- **`.env.production.example`** - Plantilla de variables

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Build de Docker termina sin errores
- [ ] Contenedor corre y está "healthy"
- [ ] Endpoint `/health` responde `{"ok":true}`
- [ ] Endpoint `/api/info` responde correctamente
- [ ] MongoDB conecta sin errores
- [ ] `.env.production` NO está en Git
- [ ] Nginx configurado (si aplica)
- [ ] SSL/HTTPS configurado (si aplica)
- [ ] Dominio apunta al VPS (si aplica)

---

## 🎉 Resultado

Con esta solución:
- ✅ El error "Permission denied" está resuelto
- ✅ Funciona en cualquier VPS
- ✅ Secretos seguros (no hardcodeados)
- ✅ Despliegue automatizado
- ✅ Listo para producción

**¿Necesitas más ayuda?** Lee `DEPLOY_VPS.md` para guía completa.
