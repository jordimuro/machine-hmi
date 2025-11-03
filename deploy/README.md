# Machine HMI - Guía de Instalación en Linux RT (ARM)

## 📋 Requisitos Previos

### En el Linux RT:
- **Node.js** 18.x o superior
- **npm** 9.x o superior
- Compilador C++ para dependencias nativas:
  ```bash
  # Debian/Ubuntu
  sudo apt-get install build-essential python3

  # Red Hat/CentOS
  sudo yum install gcc-c++ make python3
  ```

## 🚀 Instalación

### Paso 1: Preparar el paquete (en tu máquina de desarrollo)

```bash
# Ejecutar el script de deploy
chmod +x deploy.sh
./deploy.sh
```

Esto generará la carpeta `deploy/` con todo lo necesario.

### Paso 2: Transferir a Linux RT

Copia la carpeta `deploy/` a tu Linux RT usando uno de estos métodos:

**Opción A: USB**
```bash
cp -r deploy /media/usb/machine-hmi
```

**Opción B: SCP (si tienes red local)**
```bash
scp -r deploy usuario@linux-rt-ip:/home/usuario/machine-hmi
```

**Opción C: Rsync (recomendado para actualizaciones)**
```bash
rsync -avz --progress deploy/ usuario@linux-rt-ip:/home/usuario/machine-hmi/
```

### Paso 3: Configuración en Linux RT

```bash
# 1. Ir a la carpeta
cd /ruta/donde/copiaste/deploy/backend

# 2. IMPORTANTE: Recompilar dependencias nativas para ARM
./reinstall-native-deps.sh

# 3. Configurar variables de entorno
nano .env
```

Edita el archivo `.env` con tu configuración:

```bash
# Configuración mínima requerida:
OPCUA_ENDPOINT=opc.tcp://TU_IP_SERVIDOR_OPCUA:4840
JWT_SECRET=genera_un_secreto_aleatorio_aqui
PIN_OPERATOR=tu_pin_operador
PIN_MAINTENANCE=tu_pin_mantenimiento
```

### Paso 4: Iniciar el servidor

```bash
cd /ruta/donde/copiaste/deploy
./start.sh
```

### Paso 5: Acceder desde el navegador

Abre el navegador en el Linux RT y ve a:
```
http://localhost:8080
```

O desde otra máquina en la red:
```
http://IP_DEL_LINUX_RT:8080
```

## 🔧 Configuración Avanzada

### Ejecutar como servicio systemd

Para que el HMI se inicie automáticamente:

```bash
# 1. Crear archivo de servicio
sudo nano /etc/systemd/system/machine-hmi.service
```

Contenido del archivo:

```ini
[Unit]
Description=Machine HMI Service
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/ruta/completa/a/deploy/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=machine-hmi

[Install]
WantedBy=multi-user.target
```

```bash
# 2. Habilitar e iniciar el servicio
sudo systemctl daemon-reload
sudo systemctl enable machine-hmi
sudo systemctl start machine-hmi

# 3. Ver estado
sudo systemctl status machine-hmi

# 4. Ver logs
sudo journalctl -u machine-hmi -f
```

### Configurar puerto alternativo

Si el puerto 8080 está ocupado:

```bash
# En .env
PORT=3000
```

### Configurar inicio automático del navegador

Para que el navegador se abra automáticamente en kiosk mode:

```bash
# Crear script de inicio
nano ~/start-hmi-browser.sh
```

Contenido:

```bash
#!/bin/bash
# Esperar a que el servidor esté listo
sleep 5

# Iniciar navegador en kiosk mode (ejemplo con Chromium)
chromium-browser --kiosk --app=http://localhost:8080
```

Agregar a autostart de tu entorno de escritorio.

## 🐛 Troubleshooting

### Problema: "Error: Cannot find module 'better-sqlite3'"

**Solución:**
```bash
cd backend
npm rebuild better-sqlite3 --build-from-source
```

### Problema: El puerto 8080 está en uso

**Ver qué proceso lo usa:**
```bash
sudo lsof -i :8080
# o
sudo netstat -tulpn | grep 8080
```

**Cambiar puerto:**
Edita `.env` y cambia `PORT=8080` a otro puerto.

### Problema: No se puede conectar al servidor OPC UA

**Verificar conectividad:**
```bash
# Ping al servidor
ping IP_SERVIDOR_OPCUA

# Verificar puerto OPC UA abierto
nc -zv IP_SERVIDOR_OPCUA 4840
```

**Revisar configuración:**
- Verifica que `OPCUA_ENDPOINT` en `.env` sea correcto
- Formato: `opc.tcp://IP:PUERTO`
- Puerto típico: 4840

### Problema: Error de permisos al iniciar

```bash
# Dar permisos de ejecución
chmod +x start.sh
chmod +x backend/reinstall-native-deps.sh

# Si es problema de puertos < 1024, usa sudo o cambia el puerto
```

### Problema: WebSocket no se conecta

**Verificar firewall:**
```bash
# Permitir puerto en firewall (ejemplo con ufw)
sudo ufw allow 8080/tcp
```

**Verificar que WebSocket funciona:**
- Abre las DevTools del navegador (F12)
- Ve a la pestaña Network
- Busca conexiones "ws" o "websocket"
- Debe mostrar "Status: 101 Switching Protocols"

### Verificar logs del servidor

```bash
# Si usas systemd
sudo journalctl -u machine-hmi -f

# Si ejecutas manualmente, los logs aparecen en la terminal
```

### Problema: Base de datos corrupta

```bash
cd backend/src/data
rm history.db
# El servidor recreará la base de datos al iniciar
```

## 📊 Monitoreo

### Verificar estado del servidor

```bash
# Health check
curl http://localhost:8080/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "opcua": {
    "connected": true,
    "endpoint": "opc.tcp://..."
  },
  "websocket": {
    "clients": 1,
    "authenticated": 1
  }
}
```

### Verificar uso de recursos

```bash
# CPU y memoria
top -p $(pgrep -f "node src/server.js")

# O con htop
htop -p $(pgrep -f "node src/server.js")
```

## 🔄 Actualización

Para actualizar a una nueva versión:

```bash
# 1. Detener el servidor
sudo systemctl stop machine-hmi
# o Ctrl+C si está en terminal

# 2. Hacer backup de la configuración
cp backend/.env backend/.env.backup
cp -r backend/src/data backend_data_backup

# 3. Reemplazar archivos
rsync -avz --exclude='.env' --exclude='src/data' \
  nueva_version/deploy/backend/ /ruta/actual/backend/

# 4. Reinstalar dependencias nativas si es necesario
cd backend
./reinstall-native-deps.sh

# 5. Reiniciar
sudo systemctl start machine-hmi
```

## 📝 Notas Adicionales

### Arquitectura del sistema

```
┌─────────────────────────────────────────┐
│         Navegador Web (Frontend)        │
│      React + WebSocket + REST API       │
└──────────────┬──────────────────────────┘
               │ HTTP/WS Port 8080
┌──────────────▼──────────────────────────┐
│        Node.js Server (Backend)         │
│     Express + WebSocket + SQLite        │
└──────────────┬──────────────────────────┘
               │ OPC UA Port 4840
┌──────────────▼──────────────────────────┐
│          Servidor OPC UA                │
│      (PLC, SCADA, KEPServerEX...)       │
└─────────────────────────────────────────┘
```

### Rutas y comunicación

- **Frontend → Backend**: Rutas relativas (`/api`, `/ws`)
- **Todo en un solo puerto**: El backend sirve el frontend
- **Sin necesidad de internet**: Todo funciona offline
- **WebSocket para datos en tiempo real**: Actualizaciones automáticas

### Seguridad

- Cambiar `JWT_SECRET` a un valor aleatorio
- Cambiar los PINs por defecto
- Si expones a la red, considera usar HTTPS con reverse proxy
- Limitar acceso por firewall a IPs conocidas

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs del servidor
2. Verifica la configuración en `.env`
3. Asegúrate de que el servidor OPC UA es accesible
4. Comprueba que las dependencias nativas se compilaron correctamente
