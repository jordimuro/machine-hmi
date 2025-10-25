# Machine HMI Backend

Node.js backend for industrial HMI with OPC UA support.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

See `.env.example` for all available options.

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login
GET /api/auth/me (authenticated)
```

### Tags
```
GET /api/tags
GET /api/tags/:name
```

### Alarms
```
GET /api/alarms
GET /api/alarms/all
```

### History
```
GET /api/history?tag=X&from=T1&to=T2
GET /api/history/tags
```

### Commands (Maintenance only)
```
POST /api/cmd
GET /api/cmd/status
```

## WebSocket

Real-time updates available at `/ws`. Requires JWT token.

## Mock Mode

When OPC UA server is unavailable, the backend automatically switches to mock mode with simulated data.

## Database

SQLite database stored in `data/history.db`. Automatic cleanup based on retention policy.
