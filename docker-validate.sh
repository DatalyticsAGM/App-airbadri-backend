#!/bin/bash
# Script de validación pre-Docker build

echo "🔍 Validando configuración Docker..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# 1. Docker instalado
echo -n "✓ Verificando Docker... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}OK${NC} ($(docker --version))"
else
    echo -e "${RED}FALLO${NC}"
    echo "  → Instala Docker: https://docs.docker.com/get-docker/"
    ((errors++))
fi

# 2. Dockerfile existe
echo -n "✓ Verificando Dockerfile... "
if [ -f "Dockerfile" ]; then
    lines=$(wc -l < Dockerfile)
    echo -e "${GREEN}OK${NC} ($lines líneas)"
else
    echo -e "${RED}FALLO${NC}"
    ((errors++))
fi

# 3. .dockerignore existe
echo -n "✓ Verificando .dockerignore... "
if [ -f ".dockerignore" ]; then
    lines=$(wc -l < .dockerignore)
    echo -e "${GREEN}OK${NC} ($lines líneas)"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  → Recomendado para builds más rápidos"
fi

# 4. package.json existe
echo -n "✓ Verificando package.json... "
if [ -f "package.json" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FALLO${NC}"
    ((errors++))
fi

# 5. Script start existe
echo -n "✓ Verificando npm run start... "
if grep -q '"start"' package.json; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FALLO${NC}"
    echo "  → Añade script 'start' en package.json"
    ((errors++))
fi

# 6. tsconfig.json existe
echo -n "✓ Verificando tsconfig.json... "
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  → TypeScript no configurado"
fi

# 7. .env.example o .env.docker existe
echo -n "✓ Verificando variables de entorno... "
if [ -f ".env.example" ] || [ -f ".env.docker" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  → Crea .env.docker con variables de ejemplo"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ Todo listo para Docker build${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. docker build -t airbnb-backend ."
    echo "  2. docker-compose up -d"
    echo "  3. curl http://localhost:3333/health"
    exit 0
else
    echo -e "${RED}✗ Encontrados $errors errores${NC}"
    echo ""
    echo "Corrige los errores antes de continuar"
    exit 1
fi
