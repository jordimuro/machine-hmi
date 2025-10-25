# Quick Start Guide

## Test Locally (5 minutes)

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Start Backend
```bash
cd ../backend
npm run dev
```

Backend will start on http://localhost:8080 in mock mode (simulated PLC data).

### 4. Start Frontend (new terminal)
```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:3000

### 5. Login
- Open http://localhost:3000
- Use PIN: `1111` (Operator) or `2222` (Maintenance)

## What You'll See

- **Dashboard**: Real-time simulated machine data (speed, temperature, pressure, etc.)
- **Alarms**: Simulated alarms when values exceed thresholds
- **History**: Historical data graphs (data accumulates over time)
- **Commands** (Maintenance only): START, STOP, RESET_ALARMS, SET_SETPOINT

## Mock Mode Features

The backend simulates a realistic industrial process:
- Machine speed varies around setpoint
- Temperatures fluctuate realistically
- Pressure changes gradually
- Production counter increments when machine is running
- Alarms trigger when temperature >250°C or pressure >8 bar

## Deploy to Raspberry Pi

### On Raspberry Pi:
```bash
curl -fsSL <your-repo>/scripts/install-rpi.sh | bash
```

### From Development Machine:
```bash
./scripts/deploy-rpi.sh pi@192.168.1.50
```

Access HMI at: http://raspberry-pi-ip:8080

## Real OPC UA Connection

Edit `backend/.env`:
```bash
OPCUA_ENDPOINT=opc.tcp://your-plc-ip:4840
```

Edit `backend/tags.json` with your PLC's node IDs.

Restart backend - it will connect to real PLC or fallback to mock mode if unavailable.

## Next Steps

1. Configure your PLC tags in `backend/tags.json`
2. Adjust polling rates in `backend/.env`
3. Customize dashboard in `frontend/src/components/Dashboard.jsx`
4. Add custom commands in `backend/src/opcua/opcuaClient.js`

## Support

- Check README.md for full documentation
- View logs: `sudo journalctl -u machine-hmi -f` (on RPI)
- Backend logs show OPC UA connection status and mock mode activation
