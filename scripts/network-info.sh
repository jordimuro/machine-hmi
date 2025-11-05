#!/bin/bash

# Script para mostrar información de acceso de red del HMI

echo "=========================================="
echo "  Machine HMI - Información de Red"
echo "=========================================="
echo ""

# Obtener IP local
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ No se pudo detectar la IP local"
    exit 1
fi

echo "🌐 Direcciones de acceso:"
echo ""
echo "  Frontend (Interfaz Web):"
echo "    • Local:  http://localhost:3000"
echo "    • Red:    http://$LOCAL_IP:3000"
echo ""
echo "  Backend (API):"
echo "    • Local:  http://localhost:8080"
echo "    • Red:    http://$LOCAL_IP:8080"
echo ""

# Verificar si los servicios están ejecutándose
echo "🔍 Estado de servicios:"
echo ""

# Verificar frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "  ✅ Frontend: Funcionando"
else
    echo "  ❌ Frontend: No disponible"
fi

# Verificar backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health | grep -q "200"; then
    echo "  ✅ Backend: Funcionando"
else
    echo "  ❌ Backend: No disponible"
fi

echo ""
echo "📱 Acceso desde dispositivos móviles/tablets:"
echo "   Conecta tu dispositivo a la misma red WiFi/Ethernet"
echo "   y accede a: http://$LOCAL_IP:3000"
echo ""

echo "🔧 Configuración de red:"
echo "   • IP del servidor OPC UA: 192.168.68.100:4840"
echo "   • IP de esta máquina: $LOCAL_IP"
echo ""

# Mostrar información adicional de red
echo "🌐 Interfaces de red activas:"
ifconfig | grep -A 1 "flags=.*UP" | grep "inet " | grep -v 127.0.0.1 | while read line; do
    interface=$(echo "$line" | awk '{print $1}' | sed 's/://')
    ip=$(echo "$line" | awk '{print $2}')
    echo "   • $interface: $ip"
done

echo ""
echo "=========================================="