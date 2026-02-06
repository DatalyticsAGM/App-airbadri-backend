#!/bin/bash
# Script para desplegar en VPS (Producción)
# Uso: ./deploy-vps.sh

set -e  # Detener si hay errores

echo "🚀 Desplegando Airbnb Backend en VPS"
echo "======================================"

# 1. Construir imagen con Dockerfile de producción
echo ""
echo "📦 Construyendo imagen Docker..."
docker build -f Dockerfile.production -t adribnb-backend:latest .

# 2. Detener y eliminar contenedor anterior si existe
echo ""
echo "🧹 Limpiando contenedor anterior..."
docker stop airbnb-api 2>/dev/null || true
docker rm airbnb-api 2>/dev/null || true

# 3. Iniciar nuevo contenedor con variables de entorno desde archivo .env.production
echo ""
echo "🌐 Iniciando contenedor..."

# Verificar que existe .env.production
if [ ! -f .env.production ]; then
    echo "❌ ERROR: No existe el archivo .env.production"
    echo "   Crea un archivo .env.production con tus variables de producción:"
    echo ""
    echo "   NODE_ENV=production"
    echo "   PORT=3333"
    echo "   JWT_SECRET=tu_secreto_super_seguro_aqui"
    echo "   JWT_EXPIRES_IN=7d"
    echo "   MONGO_URI=mongodb+srv://..."
    echo "   FRONTEND_ORIGIN=https://tu-dominio.com"
    echo "   RESEND_API_KEY=tu_api_key_real"
    echo "   RESEND_FROM_EMAIL=noreply@tu-dominio.com"
    echo ""
    exit 1
fi

# Iniciar contenedor con variables del archivo .env.production
docker run -d \
  --name airbnb-api \
  --restart unless-stopped \
  -p 3333:3333 \
  --env-file .env.production \
  adribnb-backend:latest

echo ""
echo "⏳ Esperando que el contenedor inicie..."
sleep 5

# 4. Verificar estado
echo ""
echo "📊 Estado del contenedor:"
docker ps -a --filter "name=airbnb-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📝 Logs recientes:"
docker logs --tail 20 airbnb-api

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🔗 API disponible en: http://localhost:3333"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs:      docker logs -f airbnb-api"
echo "  - Reiniciar:     docker restart airbnb-api"
echo "  - Detener:       docker stop airbnb-api"
echo "  - Ver stats:     docker stats airbnb-api"
