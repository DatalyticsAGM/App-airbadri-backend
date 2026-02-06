#!/bin/bash
# Script para iniciar el backend con Docker Compose

echo "🐳 Iniciando Airbnb Backend con Docker..."
echo ""

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores previos..."
docker-compose down 2>/dev/null

# Limpiar volúmenes viejos (opcional)
# docker-compose down -v

# Build de la imagen
echo "🔨 Construyendo imagen..."
docker-compose build

# Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar a que arranquen
echo "⏳ Esperando a que los servicios estén listos..."
sleep 5

# Verificar estado
echo ""
echo "📊 Estado de los contenedores:"
docker-compose ps

# Verificar salud del backend
echo ""
echo "🏥 Verificando salud del backend..."
sleep 2

response=$(curl -s http://localhost:3333/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Backend funcionando correctamente"
    echo "   Respuesta: $response"
else
    echo "❌ Backend no responde"
    echo ""
    echo "📋 Ver logs con:"
    echo "   docker-compose logs -f app"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Servicios levantados"
echo ""
echo "📍 URLs:"
echo "   Backend:  http://localhost:3333"
echo "   Health:   http://localhost:3333/health"
echo "   Info:     http://localhost:3333/api/info"
echo "   MongoDB:  mongodb://localhost:27017"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker-compose logs -f app"
echo "   Reiniciar:    docker-compose restart app"
echo "   Detener:      docker-compose down"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
