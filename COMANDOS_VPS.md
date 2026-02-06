# 🎮 Comandos VPS - Cheat Sheet

Referencia rápida de todos los comandos útiles para gestionar tu aplicación en el VPS.

---

## 🚀 Despliegue

### Despliegue completo automático
```bash
./deploy-vps.sh
```

### Despliegue manual paso a paso
```bash
# 1. Construir imagen
docker build -f Dockerfile.production -t adribnb-backend:latest .

# 2. Detener contenedor anterior
docker stop airbnb-api
docker rm airbnb-api

# 3. Iniciar nuevo contenedor
docker run -d \
  --name airbnb-api \
  --restart unless-stopped \
  -p 3333:3333 \
  --env-file .env.production \
  adribnb-backend:latest
```

### Actualizar aplicación
```bash
git pull origin main
./deploy-vps.sh
```

---

## 🔍 Monitoreo

### Ver estado de contenedores
```bash
docker ps                        # Contenedores activos
docker ps -a                     # Todos los contenedores
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"  # Vista limpia
```

### Ver logs
```bash
docker logs airbnb-api           # Ver todos los logs
docker logs -f airbnb-api        # Ver logs en tiempo real (seguir)
docker logs --tail 50 airbnb-api # Ver últimas 50 líneas
docker logs --since 10m airbnb-api  # Logs últimos 10 minutos
```

### Ver uso de recursos
```bash
docker stats airbnb-api          # CPU, RAM, red, disco en tiempo real
docker stats --no-stream airbnb-api  # Solo una captura
```

### Inspeccionar contenedor
```bash
docker inspect airbnb-api        # Información completa JSON
docker inspect airbnb-api | grep IPAddress  # Ver IP del contenedor
```

---

## 🔧 Mantenimiento

### Reiniciar contenedor
```bash
docker restart airbnb-api
```

### Detener contenedor
```bash
docker stop airbnb-api
```

### Iniciar contenedor detenido
```bash
docker start airbnb-api
```

### Eliminar contenedor
```bash
docker stop airbnb-api
docker rm airbnb-api
```

### Forzar eliminación (contenedor corriendo)
```bash
docker rm -f airbnb-api
```

---

## 🐚 Acceso al Contenedor

### Ejecutar comando en contenedor
```bash
docker exec airbnb-api node -v   # Ver versión de Node
docker exec airbnb-api npm -v    # Ver versión de npm
```

### Abrir shell interactivo (bash)
```bash
docker exec -it airbnb-api sh    # Alpine usa 'sh' en lugar de 'bash'
# Dentro del contenedor puedes explorar archivos:
# ls -la /app
# cat /app/package.json
# exit (para salir)
```

### Ver variables de entorno
```bash
docker exec airbnb-api env | grep JWT
docker exec airbnb-api env | grep MONGO
docker exec airbnb-api env | sort
```

### Verificar conectividad MongoDB
```bash
docker exec -it airbnb-api node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ Conectado')).catch(e => console.error('❌ Error:', e.message))"
```

---

## 🧪 Testing

### Probar endpoints (desde el VPS)
```bash
# Health check
curl http://localhost:3333/health

# API info
curl http://localhost:3333/api/info

# Root
curl http://localhost:3333/

# Formato bonito con jq
curl -s http://localhost:3333/api/info | jq
```

### Probar endpoints (desde internet)
```bash
# Reemplaza con tu dominio
curl https://api.tu-dominio.com/health
curl https://api.tu-dominio.com/api/info
```

### Test de carga básico
```bash
# 100 requests concurrentes
for i in {1..100}; do curl -s http://localhost:3333/health & done; wait
```

---

## 🖼️ Imágenes Docker

### Listar imágenes
```bash
docker images
docker images adribnb-backend    # Solo imágenes de tu app
```

### Eliminar imagen
```bash
docker rmi adribnb-backend:latest
```

### Eliminar imágenes sin usar
```bash
docker image prune               # Imágenes dangling
docker image prune -a            # Todas las imágenes no usadas
```

### Ver tamaño de imagen
```bash
docker images adribnb-backend --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Ver historial de capas
```bash
docker history adribnb-backend:latest
```

---

## 🧹 Limpieza

### Limpiar contenedores detenidos
```bash
docker container prune
```

### Limpiar imágenes sin usar
```bash
docker image prune -a
```

### Limpiar todo (contenedores, imágenes, volúmenes, redes)
```bash
docker system prune -a --volumes
```

### Ver espacio usado por Docker
```bash
docker system df
```

---

## 📦 Gestión de Volúmenes

### Listar volúmenes
```bash
docker volume ls
```

### Eliminar volúmenes sin usar
```bash
docker volume prune
```

---

## 🌐 Nginx

### Verificar configuración
```bash
sudo nginx -t
```

### Recargar configuración
```bash
sudo systemctl reload nginx
```

### Reiniciar Nginx
```bash
sudo systemctl restart nginx
```

### Ver estado de Nginx
```bash
sudo systemctl status nginx
```

### Ver logs de Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Editar configuración
```bash
sudo nano /etc/nginx/sites-available/airbnb-api
```

---

## 🔒 SSL / Certbot

### Renovar certificado SSL
```bash
sudo certbot renew
```

### Ver certificados
```bash
sudo certbot certificates
```

### Forzar renovación
```bash
sudo certbot renew --force-renewal
```

### Test de renovación automática
```bash
sudo certbot renew --dry-run
```

---

## 🔥 Firewall (UFW)

### Ver estado
```bash
sudo ufw status
```

### Permitir puerto
```bash
sudo ufw allow 3333/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Denegar puerto
```bash
sudo ufw deny 3333/tcp
```

---

## 📊 Sistema (VPS)

### Ver uso de disco
```bash
df -h
```

### Ver uso de RAM
```bash
free -h
```

### Ver procesos
```bash
top
htop  # Si está instalado (mejor interfaz)
```

### Ver puertos abiertos
```bash
sudo netstat -tulpn
sudo lsof -i :3333
```

### Matar proceso en puerto específico
```bash
# Ver qué usa el puerto
sudo lsof -i :3333

# Matar por PID
sudo kill -9 <PID>

# O todo en uno:
sudo kill -9 $(sudo lsof -t -i:3333)
```

---

## 🔄 Git

### Actualizar código
```bash
git pull origin main
```

### Ver cambios locales
```bash
git status
git diff
```

### Ver commits recientes
```bash
git log --oneline -10
```

### Descartar cambios locales
```bash
git reset --hard origin/main
```

---

## 🛠️ Variables de Entorno

### Editar .env.production
```bash
nano .env.production
```

### Ver .env.production (sin mostrar secretos)
```bash
cat .env.production | grep -v SECRET | grep -v PASSWORD | grep -v API_KEY
```

### Validar que .env.production tiene todas las variables
```bash
grep -E '^[A-Z_]+=' .env.production.example | cut -d= -f1 | while read var; do
  if grep -q "^${var}=" .env.production; then
    echo "✅ $var"
  else
    echo "❌ FALTA: $var"
  fi
done
```

---

## 🔍 Troubleshooting

### Contenedor no inicia
```bash
# 1. Ver logs
docker logs airbnb-api

# 2. Ver por qué salió
docker inspect airbnb-api | grep -A 10 State

# 3. Intentar iniciar en primer plano (sin -d)
docker run --rm --env-file .env.production adribnb-backend:latest
```

### Puerto ya está en uso
```bash
# Ver qué usa el puerto
sudo lsof -i :3333

# Detener proceso
sudo kill -9 <PID>

# O cambiar puerto en .env.production y docker run
```

### No puede conectar a MongoDB
```bash
# Verificar URI
grep MONGO_URI .env.production

# Test de conexión
docker exec -it airbnb-api node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('OK')).catch(console.error)"

# Ver si MongoDB Atlas tiene la IP del VPS en whitelist
curl ifconfig.me  # Ver IP pública del VPS
```

### Build falla con "Permission denied"
```bash
# Verificar que estás usando Dockerfile.production
docker build -f Dockerfile.production -t adribnb-backend:latest .

# Ver permisos en imagen construida
docker run --rm adribnb-backend:latest ls -la /app/node_modules/.bin/tsc
# Debe mostrar: -rwxr-xr-x (con 'x' = ejecutable)
```

### Contenedor healthy pero no responde
```bash
# Ver si el puerto está mapeado correctamente
docker port airbnb-api

# Verificar que el puerto 3333 está abierto en firewall
sudo ufw status | grep 3333

# Probar desde dentro del contenedor
docker exec airbnb-api wget -qO- http://localhost:3333/health
```

---

## 🎯 Comandos de Un Solo Uso

### Backup de .env.production
```bash
cp .env.production .env.production.backup.$(date +%Y%m%d)
```

### Ver todas las variables de entorno del contenedor
```bash
docker exec airbnb-api env | sort
```

### Copiar archivo desde contenedor
```bash
docker cp airbnb-api:/app/package.json ./package.json
```

### Copiar archivo hacia contenedor (normalmente no necesario)
```bash
docker cp ./archivo.txt airbnb-api:/app/
```

### Ver tamaño de logs
```bash
sudo du -sh $(docker inspect --format='{{.LogPath}}' airbnb-api)
```

### Limpiar logs de contenedor
```bash
sudo truncate -s 0 $(docker inspect --format='{{.LogPath}}' airbnb-api)
```

---

## 📝 Alias Útiles

Añade estos a tu `~/.bashrc` para comandos más rápidos:

```bash
# Editar ~/.bashrc
nano ~/.bashrc

# Añadir al final:
alias dlogs='docker logs -f airbnb-api'
alias dstats='docker stats airbnb-api'
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dsh='docker exec -it airbnb-api sh'
alias dtest='curl -s http://localhost:3333/health | jq'
alias ddeploy='cd ~/airbnb-backend && ./deploy-vps.sh'

# Recargar
source ~/.bashrc
```

Luego puedes usar:
```bash
dlogs     # Ver logs
dstats    # Ver stats
dps       # Ver contenedores
dsh       # Abrir shell
dtest     # Test rápido
ddeploy   # Desplegar
```

---

## 🎓 Comandos de Aprendizaje

### Ver cómo se construyó la imagen
```bash
docker history adribnb-backend:latest --no-trunc
```

### Ver redes Docker
```bash
docker network ls
docker network inspect bridge
```

### Ver cómo se ejecutó un contenedor
```bash
docker inspect airbnb-api --format='{{.Config.Cmd}}'
docker inspect airbnb-api --format='{{json .Config.Env}}' | jq
```

---

## 🚨 Comandos de Emergencia

### Reinicio completo (todo desde cero)
```bash
# ADVERTENCIA: Esto eliminará el contenedor y la imagen
docker stop airbnb-api
docker rm airbnb-api
docker rmi adribnb-backend:latest
docker build -f Dockerfile.production -t adribnb-backend:latest .
docker run -d --name airbnb-api --restart unless-stopped -p 3333:3333 --env-file .env.production adribnb-backend:latest
```

### Rollback rápido
```bash
# Si tienes una imagen anterior taggeada como :previous
docker stop airbnb-api
docker rm airbnb-api
docker run -d --name airbnb-api --restart unless-stopped -p 3333:3333 --env-file .env.production adribnb-backend:previous
```

---

## 📞 Soporte

Si ninguno de estos comandos resuelve tu problema:

1. **Recopila información:**
   ```bash
   echo "=== Sistema ===" && uname -a
   echo "=== Docker ===" && docker --version
   echo "=== Contenedor ===" && docker ps -a | grep airbnb
   echo "=== Logs ===" && docker logs --tail 50 airbnb-api
   echo "=== Build ===" && docker images adribnb-backend
   ```

2. **Copia toda la salida** y consulta la documentación:
   - `SOLUCION_VPS.md` - Solución de problemas
   - `DEPLOY_VPS.md` - Troubleshooting section

---

**Tip:** Guarda este archivo como referencia rápida. Marca los comandos que más uses.
