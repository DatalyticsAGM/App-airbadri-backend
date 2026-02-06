# 🎯 EJECUTA ESTO EN TU VPS AHORA

## ✅ El problema `sh: tsc: Permission denied` está RESUELTO

Sigue estos pasos **en tu VPS** para verificar que funciona:

---

## 📋 Pasos a Ejecutar

### 1️⃣ Asegúrate de tener los archivos actualizados

```bash
# Si usas Git, actualiza:
git pull origin main

# Si usas SCP, vuelve a subir la carpeta completa
```

### 2️⃣ Verifica que tienes el Dockerfile correcto

```bash
# Debe decir "Dockerfile.production" en la carpeta
ls -la | grep Dockerfile
```

Deberías ver:
- `Dockerfile` (para desarrollo)
- `Dockerfile.production` (para VPS - **usa este**)

### 3️⃣ Crear archivo de variables de entorno

```bash
# Copiar plantilla
cp .env.production.example .env.production

# Editar con tus valores REALES
nano .env.production
```

**Edita estos valores:**

```env
JWT_SECRET=CAMBIA_ESTO_POR_SECRETO_FUERTE
MONGO_URI=mongodb+srv://tu_usuario:tu_password@cluster.mongodb.net/airbnb_prod
RESEND_API_KEY=re_TU_API_KEY_REAL
RESEND_FROM_EMAIL=noreply@tu-dominio.com
FRONTEND_ORIGIN=https://tu-frontend.com
```

**Guardar:** `Ctrl+O`, `Enter`, luego `Ctrl+X`

### 4️⃣ Construir imagen (ESTE ES EL PASO QUE FALLABA ANTES)

```bash
# Usar Dockerfile.production (SIN secretos hardcodeados)
docker build -f Dockerfile.production -t adribnb-backend:latest .
```

**¿Qué esperar?**

✅ **ANTES (error):**
```
ERROR [7/8] RUN npm run build
sh: tsc: Permission denied
Exit code: 126
```

✅ **AHORA (éxito):**
```
...
#12 [7/9] RUN npx tsc -p tsconfig.json
#12 DONE 8.0s
...
Successfully built abc123...
Successfully tagged adribnb-backend:latest
```

### 5️⃣ Si el build tuvo éxito, ejecutar contenedor

```bash
# Detener y limpiar si hay contenedores previos
docker stop airbnb-api 2>/dev/null || true
docker rm airbnb-api 2>/dev/null || true

# Ejecutar nuevo contenedor
docker run -d \
  --name airbnb-api \
  --restart unless-stopped \
  -p 3333:3333 \
  --env-file .env.production \
  adribnb-backend:latest
```

### 6️⃣ Verificar que funciona

```bash
# Ver estado (debe decir "Up")
docker ps

# Ver logs
docker logs -f airbnb-api
```

**Deberías ver:**
```
API lista en http://localhost:3333
Persistencia: MongoDB
```

### 7️⃣ Probar endpoints

```bash
# Abrir nueva terminal (o Ctrl+C en los logs) y ejecutar:

# Test 1: Health
curl http://localhost:3333/health
# Esperado: {"ok":true}

# Test 2: API Info
curl http://localhost:3333/api/info
# Esperado: {"version":"1.0.0","memoryOnly":false,"env":"production"}

# Test 3: Root
curl http://localhost:3333/
# Esperado: {"message":"🚀 Airbnb Backend API funcionando","version":"1.0.0"}
```

---

## 🎉 Si Todo Funciona

**¡FELICIDADES!** El problema está resuelto. Tu API está corriendo en el VPS.

### Próximos pasos (opcional):

1. **Configurar Nginx** (para acceso desde internet)
2. **Configurar SSL** (HTTPS con Let's Encrypt)
3. **Configurar dominio** (DNS apuntando al VPS)

**Ver:** `DEPLOY_VPS.md` para guía completa de estos pasos.

---

## 🐛 Si Aún Hay Problemas

### Error: "Cannot find Dockerfile.production"

```bash
# Verificar archivos
ls -la Dockerfile*

# Si no existe, crearlo:
cat > Dockerfile.production << 'EOF'
# Copiar contenido del Dockerfile.production desde el repo
EOF
```

### Error: Contenedor se detiene inmediatamente

```bash
# Ver logs de error
docker logs airbnb-api

# Verificar variables
docker exec -it airbnb-api env | grep JWT_SECRET
```

### Error: "Cannot connect to MongoDB"

1. Verifica que `MONGO_URI` en `.env.production` sea correcto
2. Añade IP del VPS a MongoDB Atlas whitelist:
   - Ve a MongoDB Atlas → Network Access
   - Add IP Address → Current IP Address

### Error persiste: "Permission denied"

```bash
# Verificar permisos dentro del contenedor
docker run --rm adribnb-backend:latest ls -la /app/node_modules/.bin/ | head -20

# Los archivos deben tener 'x' (ejecutable)
# Ejemplo: -rwxr-xr-x 1 root root ... tsc
```

---

## 📞 ¿Necesitas Ayuda?

1. **Copia el error exacto** de los logs
2. **Ejecuta:**
   ```bash
   docker --version
   uname -a
   docker logs airbnb-api 2>&1 | tail -50
   ```
3. Comparte la salida

---

## ✅ Checklist Rápido

Marca cuando completes cada paso:

- [ ] Archivos actualizados en VPS
- [ ] `.env.production` creado con valores reales
- [ ] Build de Docker terminó SIN errores
- [ ] Contenedor corriendo (`docker ps` muestra "Up")
- [ ] `/health` responde `{"ok":true}`
- [ ] `/api/info` responde correctamente
- [ ] Logs no muestran errores

**Si marcaste todos:** ¡Éxito! 🎉

---

## 🚀 Comando Todo-en-Uno (Alternativa)

Si prefieres un script automático:

```bash
# Dar permisos
chmod +x deploy-vps.sh

# Ejecutar (hace todo automáticamente)
./deploy-vps.sh
```

**Nota:** Asegúrate de haber creado `.env.production` primero.

---

## 📊 Diferencias Clave

| Aspecto | ANTES (❌ fallaba) | AHORA (✅ funciona) |
|---------|-------------------|-------------------|
| Comando build | `npm run build` | `npx tsc -p tsconfig.json` |
| Permisos node_modules | No se arreglaban | `chmod +x node_modules/.bin` |
| Propiedad archivos | Usuario root | `chown -R node:node /app` |
| Dockerfile | `Dockerfile` | `Dockerfile.production` |
| Secretos | Hardcodeados | Desde `.env.production` |

---

**¡PRUÉBALO AHORA EN TU VPS!** ⬆️
