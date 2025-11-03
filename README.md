# Machine HMI Edge

Industrial HMI web application for Raspberry Pi 3 (ARMv7) to monitor and control PLCs via OPC UA.

## 🚀 Quick Deploy to Linux RT (Offline)

**For deploying to Linux RT (ARM) without internet access:**

```bash
# 1. Run deploy script (on your development machine)
./deploy.sh

# 2. Copy the 'deploy' folder to your Linux RT via USB/network

# 3. On Linux RT:
cd deploy/backend
./reinstall-native-deps.sh  # Recompile for ARM
nano .env                    # Configure your settings
cd ..
./start.sh                   # Start the server
```

**📖 Full deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

---

## Features

- **Multi-language support**: 8 languages (English, Spanish, German, Italian, French, Polish, Chinese, Japanese)
- **Real-time monitoring**: WebSocket-based live updates of process variables
- **OPC UA integration**: Client for industrial PLCs with automatic reconnection
- **Historical data**: SQLite-based time-series storage with configurable retention
- **Alarm management**: Real-time alarm monitoring and acknowledgment
- **Role-based access**: PIN authentication with operator and maintenance roles
- **Touch-optimized UI**: Responsive interface for 10" industrial tablets
- **Mock mode**: Built-in simulation for testing without real PLC

## Architecture

- **Backend**: Node.js + Express + WebSocket
- **Frontend**: React + Vite (SPA)
- **Protocol**: OPC UA client
- **Database**: SQLite for historical data
- **Deployment**: systemd service + static file serving

## Requirements

- Raspberry Pi 3 or newer (ARMv7/ARMv8)
- Raspbian/Raspberry Pi OS
- Node.js 18+ (LTS recommended)
- 512MB+ RAM available
- Network access to OPC UA server

## Quick Start (Development)

1. **Clone the repository**
   ```bash
   cd machine-hmi
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # From project root
   ./scripts/dev.sh
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - Default PINs: Operator `1111`, Maintenance `2222`

## Installation on Raspberry Pi

### 1. Prepare Raspberry Pi

Run the installation script on your Raspberry Pi:

```bash
# On Raspberry Pi
curl -fsSL https://raw.githubusercontent.com/your-repo/machine-hmi-edge/main/scripts/install-rpi.sh | bash
```

Or manually:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3

# Create directories
sudo mkdir -p /opt/machine-hmi-backend/data
sudo mkdir -p /opt/machine-hmi-frontend/dist
sudo chown -R pi:pi /opt/machine-hmi-*
```

### 2. Configure

Edit `/opt/machine-hmi-backend/.env`:

```bash
# OPC UA Server
OPCUA_ENDPOINT=opc.tcp://192.168.1.10:4840

# Polling rates
POLLING_RATE_MS=1000
LOG_INTERVAL_MS=5000

# Security
JWT_SECRET=your_secure_random_string_here
PIN_OPERATOR=1111
PIN_MAINTENANCE=2222

# Server
PORT=8080
NODE_ENV=production
```

Edit `/opt/machine-hmi-backend/tags.json` to configure your PLC tags.

### 3. Deploy from Development Machine

```bash
# Build and deploy
./scripts/deploy-rpi.sh pi@192.168.1.50

# Or skip build step
./scripts/deploy-rpi.sh pi@192.168.1.50 skip-build
```

### 4. Manage Service

```bash
# Check status
sudo systemctl status machine-hmi

# View logs
sudo journalctl -u machine-hmi -f

# Restart
sudo systemctl restart machine-hmi

# Stop
sudo systemctl stop machine-hmi
```

## Configuration

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPCUA_ENDPOINT` | OPC UA server URL | `opc.tcp://localhost:4840` |
| `POLLING_RATE_MS` | Tag polling interval | `1000` |
| `LOG_INTERVAL_MS` | History logging interval | `5000` |
| `JWT_SECRET` | Secret for JWT tokens | `change_me_in_production` |
| `PIN_OPERATOR` | Operator PIN code | `1111` |
| `PIN_MAINTENANCE` | Maintenance PIN code | `2222` |
| `PORT` | HTTP server port | `8080` |
| `NODE_ENV` | Environment | `production` |
| `HISTORY_RETENTION_HOURS` | Data retention | `24` |

### Tags Configuration (tags.json)

```json
{
  "pollingRateMs": 1000,
  "tags": {
    "TagName": {
      "nodeId": "ns=2;s=Machine.Tag",
      "loggable": true,
      "type": "number",
      "unit": "RPM",
      "min": 0,
      "max": 3000,
      "writable": false,
      "alarm": false,
      "message": "Optional alarm message"
    }
  }
}
```

**Tag Properties:**
- `nodeId`: OPC UA Node ID
- `loggable`: Store in historical database
- `type`: `number`, `boolean`, or `string`
- `unit`: Display unit (optional)
- `min`/`max`: Value limits (optional)
- `writable`: Allow writing from HMI
- `alarm`: Treat as alarm tag
- `message`: Alarm description

## API Reference

### Authentication

- `POST /api/auth/login` - Login with PIN
  ```json
  { "pin": "1111" }
  ```

- `GET /api/auth/me` - Get current user (requires auth)

### Tags

- `GET /api/tags` - Get all tags
- `GET /api/tags/:name` - Get specific tag

### Alarms

- `GET /api/alarms` - Get active alarms
- `GET /api/alarms/all` - Get all alarms (including inactive)

### History

- `GET /api/history?tag=X&from=T1&to=T2` - Query historical data
- `GET /api/history/tags` - Get available tags

### Commands (Maintenance only)

- `POST /api/cmd` - Execute command
  ```json
  {
    "command": "START" | "STOP" | "RESET_ALARMS" | "SET_SETPOINT",
    "params": { "tag": "SetpointSpeed", "value": 1500 }
  }
  ```

- `GET /api/cmd/status` - Get OPC UA connection status

### Health

- `GET /api/health` - System health check

## WebSocket

Connect to `/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=YOUR_JWT_TOKEN');

// Message types
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'tag_update':
      // { name, value, quality, timestamp }
      break;
    case 'alarm_update':
      // { id, active, message, since }
      break;
  }
};
```

## Development

### Project Structure

```
machine-hmi/
├── backend/
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/             # Configuration
│   │   ├── opcua/              # OPC UA client
│   │   ├── stores/             # Data stores
│   │   ├── auth/               # Authentication
│   │   ├── routes/             # REST API routes
│   │   └── websocket/          # WebSocket handler
│   ├── tags.json               # Tags configuration
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API & WebSocket clients
│   │   ├── hooks/              # Custom hooks
│   │   └── styles/             # CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── scripts/
    ├── dev.sh                  # Development mode
    ├── build-frontend.sh       # Build frontend
    ├── deploy-rpi.sh           # Deploy to RPI
    ├── install-rpi.sh          # RPI setup
    └── machine-hmi.service     # systemd unit
```

### Mock Mode

The backend includes a mock OPC UA client for development without a real PLC:

- Simulates realistic tag values with random variation
- Generates alarms based on conditions
- Automatically enabled when OPC UA server is unavailable
- Supports all write operations

### Adding New Tags

1. Edit `backend/tags.json`:
   ```json
   {
     "NewTag": {
       "nodeId": "ns=2;s=Path.To.Tag",
       "loggable": true,
       "type": "number"
     }
   }
   ```

2. Restart backend
3. Tag will appear automatically in Dashboard

### Adding New Commands

1. Edit `backend/src/opcua/opcuaClient.js`:
   ```javascript
   async executeCommand(command, params) {
     switch (command) {
       case 'NEW_COMMAND':
         // Implementation
         break;
     }
   }
   ```

2. Add UI button in `frontend/src/components/Commands.jsx`

## Troubleshooting

### Backend won't start

- Check logs: `sudo journalctl -u machine-hmi -f`
- Verify Node.js version: `node --version` (needs 18+)
- Check port availability: `sudo lsof -i :8080`
- Verify permissions: `ls -la /opt/machine-hmi-backend`

### OPC UA connection failed

- Verify endpoint in `.env`
- Check network connectivity: `ping <plc-ip>`
- Check firewall rules
- Backend will use mock mode if connection fails

### WebSocket disconnects

- Check network stability
- Verify JWT token validity (12h expiration)
- Check browser console for errors

### High memory usage

- Reduce `HISTORY_RETENTION_HOURS`
- Decrease number of `loggable` tags
- Increase `LOG_INTERVAL_MS`

### Frontend not loading

- Verify build: `ls -la frontend/dist`
- Check nginx/Express static file serving
- Clear browser cache
- Check browser console for errors

## Security Considerations

- Change default PINs in production
- Use strong `JWT_SECRET` (32+ characters)
- Run behind reverse proxy (nginx) with HTTPS
- Implement network segmentation (OT/IT)
- Regularly update dependencies
- Monitor access logs
- Consider VPN for remote access

## Performance Tuning

### Raspberry Pi 3 Optimization

- Disable GUI: `sudo systemctl set-default multi-user.target`
- Increase swap: Edit `/etc/dphys-swapfile`
- Overclock (with cooling): Edit `/boot/config.txt`
- Use lite OS: Raspberry Pi OS Lite
- Disable unnecessary services

### Application Tuning

- Adjust `POLLING_RATE_MS` (500-2000ms recommended)
- Limit `loggable` tags to essential ones
- Reduce `HISTORY_RETENTION_HOURS` for lower memory
- Use `LOG_INTERVAL_MS` >= 5000ms

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-repo/machine-hmi-edge/issues
- Documentation: https://github.com/your-repo/machine-hmi-edge/wiki

## Multi-Language Support

The application supports 8 languages with easy switching via flag selector:

### Supported Languages
- 🇬🇧 **English** (en) - Default
- 🇪🇸 **Spanish** (es) - Español
- 🇩🇪 **German** (de) - Deutsch
- 🇮🇹 **Italian** (it) - Italiano
- 🇫🇷 **French** (fr) - Français
- 🇵🇱 **Polish** (pl) - Polski
- 🇨🇳 **Chinese** (zh) - 中文
- 🇯🇵 **Japanese** (ja) - 日本語

### Features
- **Flag selector** in header for quick language switching
- **localStorage persistence** - selected language remembered across sessions
- **Full translation** - all UI elements, messages, and labels
- **Real-time switching** - no page reload required
- **Fallback to English** if translation missing

### Implementation
- Uses `react-i18next` for internationalization
- Translation files in `frontend/src/locales/{language}/translation.json`
- Language selector component in header
- Browser language auto-detection on first load

## Roadmap

- [x] Multi-language support (8 languages)
- [ ] Email/SMS alarm notifications
- [ ] Data export (CSV/Excel)
- [ ] Custom dashboards
- [ ] Recipe management
- [ ] Audit logging
- [ ] MQTT integration
- [ ] Modbus TCP support
