# Railway Deployment - Error Fix

## ❌ Error Original

```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## ✅ Solución Aplicada

### 1. Generados archivos `package-lock.json`

Se generaron los archivos de lock para ambos proyectos:

```bash
cd backend && npm install --package-lock-only
cd ../frontend && npm install --package-lock-only
```

Resultado:
- ✅ `backend/package-lock.json` (163K)
- ✅ `frontend/package-lock.json` (119K)

### 2. Actualizado `.gitignore`

**Antes:**
```gitignore
node_modules/
package-lock.json  # ❌ Esto impedía subir los lock files
```

**Después:**
```gitignore
node_modules/
# package-lock.json eliminado del gitignore
```

### 3. Actualizado `nixpacks.toml`

**Configuración final:**
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'python3']

[phases.install]
cmds = [
  'npm ci --prefix frontend --legacy-peer-deps',
  'npm ci --prefix backend'
]

[phases.build]
cmds = [
  'npm run build --prefix frontend'
]

[start]
cmd = 'cd backend && NODE_ENV=production node src/server.js'
```

**Cambios clave:**
- ✅ Usa `npm ci` (más rápido y confiable)
- ✅ `--prefix` para especificar directorio sin cambiar el working directory
- ✅ `--legacy-peer-deps` para frontend (compatibilidad React 18)
- ✅ Python 3 incluido (necesario para `better-sqlite3`)

## 🚀 Pasos para Desplegar Ahora

### 1. Commit y Push
```bash
cd /Users/jordipascualselles/machine-hmi

# Agregar todos los archivos nuevos
git add .

# Commit
git commit -m "Fix: Add package-lock.json and Railway configuration

- Add package-lock.json for frontend and backend
- Update .gitignore to allow lock files
- Configure nixpacks.toml for proper Railway build
- Add Railway deployment documentation"

# Push
git push origin main
```

### 2. Redeploy en Railway

Railway detectará el push y re-desplegará automáticamente.

O manualmente:
1. Ve al dashboard de Railway
2. Click en tu servicio
3. Click en "Redeploy" o "Deploy"

### 3. Verificar Variables de Entorno

Asegúrate de tener configuradas:

```env
NODE_ENV=production
PORT=8080
JWT_SECRET=<tu-secret-seguro>
OPERATOR_PIN=1111
MAINTENANCE_PIN=2222
```

## 📋 Checklist de Verificación

- [x] `package-lock.json` generados
- [x] `.gitignore` actualizado
- [x] `nixpacks.toml` configurado
- [x] `package.json` raíz creado
- [x] `railway.toml` creado
- [ ] Archivos committeados
- [ ] Push a GitHub
- [ ] Variables de entorno configuradas en Railway
- [ ] Build exitoso en Railway
- [ ] App accesible en la URL de Railway

## 🔍 Logs de Build Esperados

Durante el build, deberías ver:

```
✓ Installing dependencies...
  → npm ci --prefix frontend --legacy-peer-deps
  → npm ci --prefix backend
✓ Building application...
  → npm run build --prefix frontend
  ✓ Built in 45s
✓ Starting application...
  → cd backend && NODE_ENV=production node src/server.js
  ✓ Server listening on port 8080
```

## 🐛 Troubleshooting

### Si el build aún falla:

**Error con `better-sqlite3`:**
```
Asegúrate de que Python 3 está en nixpacks.toml:
nixPkgs = ['nodejs_20', 'python3']
```

**Error con peer dependencies:**
```
Frontend usa --legacy-peer-deps
Si persiste, cambia a: npm install --force
```

**Error "Module not found" en runtime:**
```
Verifica que NODE_ENV=production esté configurado
Revisa que backend/package.json tenga todas las dependencias
```

### Comando de diagnóstico:

Para probar el build localmente:

```bash
# Simular el proceso de Railway
cd /Users/jordipascualselles/machine-hmi

# Limpiar
rm -rf frontend/node_modules frontend/dist
rm -rf backend/node_modules

# Instalar (como Railway)
npm ci --prefix frontend --legacy-peer-deps
npm ci --prefix backend

# Build (como Railway)
npm run build --prefix frontend

# Start (como Railway)
cd ../backend && NODE_ENV=production node src/server.js
```

## ✅ Resultado Esperado

Una vez deployado exitosamente:

1. **URL pública**: `https://tu-app.railway.app`
2. **Health check**: `https://tu-app.railway.app/api/health`
3. **Login**: PIN 1111 o 2222
4. **Multi-idioma**: 8 idiomas disponibles 🌍
5. **Mock data**: Datos simulados del PLC

## 📚 Documentación Adicional

- **Guía completa**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Guía rápida**: [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)
- **README principal**: [README.md](./README.md)

## 🎯 Próximos Pasos

1. ✅ Hacer commit y push
2. ✅ Esperar el deploy en Railway
3. ✅ Verificar que la app funciona
4. ⚠️ Cambiar PINs por defecto
5. ⚠️ Generar JWT_SECRET seguro
6. 🌐 (Opcional) Configurar dominio custom
7. 🔌 (Opcional) Conectar a PLC real

---

**Última actualización**: 2025-10-25
**Estado**: ✅ Listo para desplegar
