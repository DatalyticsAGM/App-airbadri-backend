# Usa Node.js 22.22 con npm 10.9
FROM node:22.22-alpine

# Instala herramientas necesarias
RUN apk add --no-cache dumb-init

# Establece el directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala todas las dependencias (incluidas devDependencies para compilar TypeScript)
RUN npm ci

# Copia el código fuente
COPY . .

# Arregla permisos DESPUÉS de copiar todo (necesario en VPS)
RUN chmod -R 755 /app && \
    chmod -R +x /app/node_modules/.bin 2>/dev/null || true

# Compila TypeScript a JavaScript
RUN npm run build

# Elimina devDependencies para reducir tamaño de imagen
RUN npm prune --production

# Variables de entorno por defecto (⚠️ SOLO PARA DESARROLLO)
# Para producción, SIEMPRE pasar variables con docker run -e o docker-compose
ENV NODE_ENV=production \
    PORT=3333 \
    JWT_SECRET=dev_secret_change_in_production_12345678 \
    JWT_EXPIRES_IN=7d \
    MONGO_URI=mongodb+srv://adriangallardogm_db_user:Adryan1998@adribnb.as0xziy.mongodb.net/bbddadri?appName=Adribnb \
    DNS_SERVERS=1.1.1.1,8.8.8.8 \
    FRONTEND_ORIGIN=http://localhost:3000 \
    RESEND_API_KEY=re_EBC2buMx_81x53QpPRczzcLfcVpeWfQEk \
    RESEND_FROM_EMAIL=onboarding@resend.dev

# Expone el puerto (ajusta según tu .env)
EXPOSE 3333

# Usuario no-root para seguridad
USER node

# Healthcheck para Docker/Kubernetes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Ejecuta la aplicación con dumb-init (manejo correcto de señales)
CMD ["dumb-init", "node", "dist/server.js"]
