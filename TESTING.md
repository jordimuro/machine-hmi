# Testing Guide

## Local Testing (Development Mode)

### 1. Backend Testing

```bash
cd backend
npm install
npm run dev
```

**What to verify:**
- ✅ Server starts on port 8080
- ✅ "Mock OPC UA mode enabled" appears in logs
- ✅ Tags are initialized with mock data
- ✅ Historical database created in `data/history.db`

**Test endpoints:**
```bash
# Health check
curl http://localhost:8080/api/health

# Get all tags (no auth required)
curl http://localhost:8080/api/tags

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1111"}'

# Get alarms
curl http://localhost:8080/api/alarms
```

### 2. Frontend Testing

```bash
cd frontend
npm install
npm run dev
```

**What to verify:**
- ✅ Frontend starts on port 3000
- ✅ Login page loads
- ✅ Can enter PIN using on-screen keypad
- ✅ No console errors

### 3. Integration Testing

With both servers running:

1. **Login Flow**
   - Open http://localhost:3000
   - Enter PIN: `1111` (Operator) or `2222` (Maintenance)
   - Should redirect to Dashboard

2. **Dashboard**
   - ✅ See 6+ tag cards with values
   - ✅ Values update in real-time
   - ✅ Quality indicators (green dots)
   - ✅ Connection status shows "Connected"

3. **Alarms**
   - ✅ Navigate to Alarms tab
   - ✅ Should show "All Clear" initially
   - ✅ Wait for temperature/pressure alarms to trigger
   - ✅ Alarms appear with timestamps

4. **History**
   - ✅ Navigate to History tab
   - ✅ Wait 1-2 minutes for data to accumulate
   - ✅ Select tag from dropdown
   - ✅ Graph displays with data points
   - ✅ Statistics show average/min/max

5. **Commands** (Maintenance only)
   - ✅ Login with PIN `2222`
   - ✅ Navigate to Commands tab
   - ✅ Click START button
   - ✅ Confirm in modal
   - ✅ Success message appears
   - ✅ MachineRunning tag changes to ON

## WebSocket Testing

Open browser console and monitor:

```javascript
// Should see WebSocket messages
// tag_update: { name, value, quality, timestamp }
// alarm_update: { id, active, message, since }
```

## Mock Mode Behavior

The mock mode simulates realistic behavior:

### Machine Speed
- Starts around 1500 RPM
- Random walk ±30 RPM per poll
- Bounded 0-3000 RPM

### Temperatures
- Start around 150°C
- Random walk ±3°C per poll
- Alarm triggers at >250°C

### Pressure
- Starts around 5 bar
- Random walk ±0.1 bar per poll
- Alarm triggers at >8 bar

### Production Count
- Increments when MachineRunning = true
- ~0.5 units per poll cycle

### Alarms
- Auto-trigger when thresholds exceeded
- Auto-clear when values return to normal

## Performance Testing

### Backend Load Test

```bash
# Install autocannon
npm install -g autocannon

# Test health endpoint
autocannon -c 10 -d 30 http://localhost:8080/api/health

# Test tags endpoint
autocannon -c 10 -d 30 http://localhost:8080/api/tags
```

**Expected results:**
- >100 req/sec on modern hardware
- <100ms p99 latency

### WebSocket Load Test

```bash
# Install wscat
npm install -g wscat

# Connect multiple clients
for i in {1..10}; do
  wscat -c "ws://localhost:8080/ws" &
done
```

**Expected results:**
- All clients receive updates
- No disconnections
- Heartbeat every 30s

### Memory Test

```bash
# Backend memory usage
ps aux | grep "node.*server.js"

# Watch for leaks
while true; do
  ps aux | grep "node.*server.js" | awk '{print $6}'
  sleep 10
done
```

**Expected results:**
- Stable ~100-150MB after initialization
- No continuous growth

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS/Android)

**What to verify:**
- Touch events work
- Buttons are >60x60px
- Text is readable (16px+)
- WebSocket reconnects on network change
- Token persists across page reloads

## Raspberry Pi Testing

### Pre-deployment Checks

1. **SSH Access**
   ```bash
   ssh pi@192.168.1.50
   ```

2. **Network Connectivity**
   ```bash
   ping 8.8.8.8
   curl -I https://registry.npmjs.org
   ```

3. **Disk Space**
   ```bash
   df -h
   # Need >500MB free
   ```

### Deployment Test

```bash
# From dev machine
./scripts/deploy-rpi.sh pi@192.168.1.50
```

**What to verify:**
- ✅ Deployment completes without errors
- ✅ Service starts automatically
- ✅ Web interface accessible

### Service Testing

```bash
# On Raspberry Pi
sudo systemctl status machine-hmi
sudo journalctl -u machine-hmi -f

# Test restart
sudo systemctl restart machine-hmi

# Test stop/start
sudo systemctl stop machine-hmi
sudo systemctl start machine-hmi
```

### Production Smoke Test

1. Access http://rpi-ip:8080
2. Login with production PIN
3. Verify Dashboard loads
4. Check connection status
5. Test one command (START/STOP)
6. Verify alarms appear
7. Check history graph

## Troubleshooting Tests

### Test 1: Backend won't start

```bash
# Check port
sudo lsof -i :8080

# Check logs
sudo journalctl -u machine-hmi --no-pager -n 50

# Check permissions
ls -la /opt/machine-hmi-backend
```

### Test 2: OPC UA connection issues

```bash
# Test network to PLC
ping <plc-ip>
telnet <plc-ip> 4840

# Check endpoint in .env
cat /opt/machine-hmi-backend/.env | grep OPCUA_ENDPOINT

# Backend should fallback to mock mode
sudo journalctl -u machine-hmi | grep -i "mock mode"
```

### Test 3: WebSocket disconnects

- Open browser DevTools → Network → WS
- Watch WebSocket connection
- Should show pings every 25s
- Should auto-reconnect on disconnect

### Test 4: High memory usage

```bash
# Check database size
du -h /opt/machine-hmi-backend/data/history.db

# Check retention setting
cat /opt/machine-hmi-backend/.env | grep RETENTION

# Manual cleanup
sqlite3 /opt/machine-hmi-backend/data/history.db "DELETE FROM history WHERE timestamp < strftime('%s', 'now', '-24 hours') * 1000"
```

## Automated Testing (Future)

To implement:
- Unit tests with Jest
- API tests with Supertest
- E2E tests with Playwright
- Load tests with k6

Example test structure:
```
backend/test/
├── unit/
│   ├── stores.test.js
│   ├── auth.test.js
│   └── opcua.test.js
├── integration/
│   ├── api.test.js
│   └── websocket.test.js
└── e2e/
    └── flows.test.js
```

## Acceptance Criteria

Before production deployment:
- [ ] Backend runs stable for 24h in development
- [ ] Frontend works on target tablets
- [ ] WebSocket survives network interruptions
- [ ] Historical data accumulates correctly
- [ ] Alarms trigger and clear properly
- [ ] Commands execute successfully
- [ ] All roles work as expected
- [ ] Service restarts automatically
- [ ] Documentation is complete
- [ ] Security checklist completed
