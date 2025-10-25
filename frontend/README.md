# Machine HMI Frontend

React-based frontend for industrial HMI.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The frontend runs on port 3000 and proxies API requests to the backend on port 8080.

## Components

- **Login**: PIN-based authentication
- **Dashboard**: Real-time process monitoring
- **Alarms**: Active alarm list
- **History**: Historical data trends
- **Commands**: Machine control (maintenance only)

## Services

- **apiClient**: REST API communication
- **wsClient**: WebSocket real-time updates

## Hooks

- **useAuth**: Authentication context
- **useWebSocket**: WebSocket connection and updates
- **useTags**: Real-time tag values
- **useAlarms**: Real-time alarms

## Build Output

Production build outputs to `dist/` directory. Can be served by Express backend or separate web server.
