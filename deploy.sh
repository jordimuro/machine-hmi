#!/bin/bash

###############################################################################
# Script de Deploy para Linux RT (ARM)
# Machine HMI - Sistema HMI Industrial con OPC UA
###############################################################################

set -e  # Detener en caso de error

echo "========================================="
echo "  Machine HMI - Deploy Script"
echo "  Target: Linux RT (ARM)"
echo "========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
DEPLOY_DIR="deploy"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Limpiar deploy anterior
echo -e "${YELLOW}[1/6]${NC} Limpiando directorio de deploy anterior..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Compilar frontend
echo -e "${YELLOW}[2/6]${NC} Compilando frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  → Instalando dependencias del frontend..."
    npm install
fi
npm run build
cd ..

# Verificar que dist existe
if [ ! -d "$FRONTEND_DIR/dist" ]; then
    echo -e "${RED}Error: No se generó la carpeta dist${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Frontend compilado${NC}"

# Copiar backend
echo -e "${YELLOW}[3/6]${NC} Copiando backend..."
mkdir -p "$DEPLOY_DIR/backend"
cp -r "$BACKEND_DIR/src" "$DEPLOY_DIR/backend/"
cp "$BACKEND_DIR/package.json" "$DEPLOY_DIR/backend/"
cp "$BACKEND_DIR/package-lock.json" "$DEPLOY_DIR/backend/"
echo -e "${GREEN}  ✓ Backend copiado${NC}"

# Copiar frontend compilado
echo -e "${YELLOW}[4/6]${NC} Copiando frontend compilado..."
mkdir -p "$DEPLOY_DIR/backend/frontend"
cp -r "$FRONTEND_DIR/dist" "$DEPLOY_DIR/backend/frontend/"
echo -e "${GREEN}  ✓ Frontend copiado${NC}"

# Instalar dependencias de producción
echo -e "${YELLOW}[5/6]${NC} Instalando dependencias de producción..."
cd "$DEPLOY_DIR/backend"

# IMPORTANTE: Para ARM, necesitamos asegurarnos de que better-sqlite3 se compile correctamente
# En el Linux RT, puede que necesites reinstalar esta dependencia
echo "  → Instalando dependencias..."
npm install --production --ignore-scripts
echo -e "${GREEN}  ✓ Dependencias instaladas${NC}"

cd ../..

# Crear archivos de configuración
echo -e "${YELLOW}[6/6]${NC} Creando archivos de configuración..."

# Copiar .env si existe
if [ -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env" "$DEPLOY_DIR/backend/.env"
    echo -e "${GREEN}  ✓ .env copiado${NC}"
else
    echo -e "${YELLOW}  ⚠ No se encontró .env, usando .env.production de ejemplo${NC}"
fi

# Copiar .env.production de ejemplo
cp ".env.production" "$DEPLOY_DIR/backend/.env.production.example"

# Copiar scripts de inicio
cp "start.sh" "$DEPLOY_DIR/"
chmod +x "$DEPLOY_DIR/start.sh"

# Copiar instrucciones
cp "DEPLOYMENT.md" "$DEPLOY_DIR/README.md"

# Crear script de reinstalación para ARM
cat > "$DEPLOY_DIR/backend/reinstall-native-deps.sh" << 'EOF'
#!/bin/bash
# Script para reinstalar dependencias nativas en ARM
echo "Reinstalando dependencias nativas para ARM..."
npm rebuild better-sqlite3 --build-from-source
echo "✓ Completado"
EOF
chmod +x "$DEPLOY_DIR/backend/reinstall-native-deps.sh"

# Resumen
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✓ Deploy completado exitosamente${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Carpeta generada: $DEPLOY_DIR/"
echo ""
echo "Estructura:"
echo "  $DEPLOY_DIR/"
echo "  ├── backend/"
echo "  │   ├── src/                    # Código del backend"
echo "  │   ├── frontend/dist/          # Frontend compilado"
echo "  │   ├── node_modules/           # Dependencias"
echo "  │   ├── package.json"
echo "  │   ├── .env.production.example"
echo "  │   └── reinstall-native-deps.sh"
echo "  ├── start.sh                    # Script de inicio"
echo "  └── README.md                   # Instrucciones"
echo ""
echo -e "${YELLOW}IMPORTANTE para Linux RT ARM:${NC}"
echo "  1. Copia la carpeta '$DEPLOY_DIR' a tu Linux RT"
echo "  2. En el Linux RT, ejecuta:"
echo "     cd $DEPLOY_DIR/backend"
echo "     ./reinstall-native-deps.sh"
echo "  3. Configura el archivo .env"
echo "  4. Inicia el servidor:"
echo "     cd $DEPLOY_DIR"
echo "     ./start.sh"
echo ""
echo "  Accede desde el navegador: http://localhost:8080"
echo ""
