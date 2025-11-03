#!/bin/bash
# Script para reinstalar dependencias nativas en ARM
echo "Reinstalando dependencias nativas para ARM..."
npm rebuild better-sqlite3 --build-from-source
echo "✓ Completado"
