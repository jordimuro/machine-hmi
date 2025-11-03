#!/bin/bash

###############################################################################
# Script de inicio para Machine HMI en Linux RT
###############################################################################

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "  Machine HMI - Starting Server"
echo "========================================="
echo ""

# Cambiar al directorio del backend
cd backend

# Verificar que existe .env
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        echo -e "${YELLOW}⚠ No se encontró .env, copiando desde .env.production.example${NC}"
        cp .env.production.example .env
        echo -e "${YELLOW}⚠ IMPORTANTE: Edita el archivo .env antes de usar en producción${NC}"
        echo ""
    else
        echo -e "${RED}Error: No se encontró archivo .env ni .env.production.example${NC}"
        exit 1
    fi
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado${NC}"
    echo "Instala Node.js 18+ antes de continuar"
    exit 1
fi

# Mostrar versión de Node.js
NODE_VERSION=$(node --version)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${RED}Error: node_modules no encontrado${NC}"
    echo "Ejecuta primero: cd backend && npm install --production"
    exit 1
fi

# Verificar better-sqlite3 (dependencia nativa crítica)
if [ ! -f "node_modules/better-sqlite3/build/Release/better_sqlite3.node" ]; then
    echo -e "${YELLOW}⚠ Dependencia nativa better-sqlite3 no compilada para esta arquitectura${NC}"
    echo "Ejecutando recompilación..."
    if [ -f "./reinstall-native-deps.sh" ]; then
        ./reinstall-native-deps.sh
    else
        npm rebuild better-sqlite3 --build-from-source
    fi
    echo ""
fi

# Obtener configuración
source .env
PORT=${PORT:-8080}

echo "Configuración:"
echo "  - Puerto: $PORT"
echo "  - OPC UA Endpoint: ${OPCUA_ENDPOINT:-'No configurado'}"
echo "  - Modo: production"
echo ""

# Verificar que el puerto está libre
if command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}Error: El puerto $PORT ya está en uso${NC}"
        echo "Procesos usando el puerto:"
        lsof -Pi :$PORT -sTCP:LISTEN
        exit 1
    fi
fi

echo -e "${GREEN}Iniciando servidor...${NC}"
echo ""
echo "========================================="
echo ""

# Iniciar el servidor
NODE_ENV=production node src/server.js

# Si el servidor se detiene, mostrar mensaje
echo ""
echo -e "${YELLOW}Servidor detenido${NC}"
