#!/bin/bash

echo "🧪 Probando el sistema de login..."
echo ""

# Probar credenciales válidas
echo "✅ Probando admin/2222:"
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"2222"}' | jq .

echo ""
echo "✅ Probando guest/1111:"
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guest","password":"1111"}' | jq .

echo ""
echo "❌ Probando credenciales inválidas:"
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid","password":"0000"}' | jq .

echo ""
echo "🎯 Pruebas completadas!"