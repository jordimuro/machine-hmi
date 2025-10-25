# Railway Deployment Guide

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

## Manual Deployment Steps

### 1. Prerequisites
- Railway account ([railway.app](https://railway.app))
- Git repository with your code

### 2. Create New Project
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 3. Configure Environment Variables

In Railway project settings, add these environment variables:

**Required:**
```
NODE_ENV=production
PORT=8080
JWT_SECRET=<generate-strong-secret>
OPERATOR_PIN=1111
MAINTENANCE_PIN=2222
```

**OPC UA Configuration (Optional - defaults to mock mode):**
```
OPCUA_ENDPOINT=opc.tcp://your-plc-ip:4840
OPCUA_POLLING_RATE=1000
```

**Database Configuration (Optional):**
```
HISTORY_RETENTION_HOURS=24
HISTORY_LOGGING_INTERVAL=5000
```

### 4. Deploy

Railway will automatically:
1. Detect the `nixpacks.toml` configuration
2. Install frontend dependencies
3. Build React frontend with Vite
4. Install backend dependencies
5. Start the Node.js server

The backend serves both:
- API endpoints at `/api/*`
- Static frontend files at `/*`

### 5. Access Your Application

Once deployed, Railway will provide a URL like:
```
https://your-app.railway.app
```

Default login credentials:
- **Operator**: PIN `1111`
- **Maintenance**: PIN `2222`

⚠️ **Change these PINs in production!**

## Architecture

```
Railway Container
├── Node.js 20.x
├── Python 3 (for native dependencies)
├── backend/
│   ├── src/          # Node.js backend
│   └── data/         # SQLite database (ephemeral)
└── frontend/
    └── dist/         # Built React app
```

## Important Notes

### Persistent Storage
Railway's filesystem is **ephemeral**. The SQLite database will be reset on each deployment.

For production, consider:
1. Use Railway's Volume feature for persistent storage
2. Or migrate to PostgreSQL (Railway addon)

### Environment Variables
- Never commit `.env` files
- Set all secrets in Railway's environment variables
- Use Railway's "Shared Variables" for multi-service projects

### Mock Mode
By default, the app runs in **mock mode** (simulates OPC UA data).

To connect to a real PLC:
1. Set `OPCUA_ENDPOINT` in Railway environment
2. Ensure network connectivity to PLC
3. May require Railway's Private Networking feature

### Monitoring
- View logs: Railway dashboard → Your service → Logs tab
- Health check: `https://your-app.railway.app/api/health`
- Metrics: Railway dashboard → Metrics tab

## Build Configuration

### `nixpacks.toml`
Defines the build process:
- Node.js 20.x + Python 3
- Installs frontend & backend dependencies
- Builds frontend production bundle
- Starts backend server

### `railway.toml`
Deployment configuration:
- Build command: `npm run build`
- Start command: `npm start`
- Restart policy: on failure (max 10 retries)

### Root `package.json`
Orchestrates monorepo build:
```json
{
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "start": "cd backend && npm install --production && node src/server.js"
  }
}
```

## Troubleshooting

### Build Fails: "Module not found"
- Check `nixpacks.toml` install commands
- Verify `package.json` in both `frontend/` and `backend/`

### App Crashes: "Cannot find module"
- Ensure `NODE_ENV=production` is set
- Check backend `package.json` dependencies

### OPC UA Connection Fails
- Verify `OPCUA_ENDPOINT` environment variable
- Check PLC network accessibility
- Review logs for connection errors
- Mock mode activates automatically as fallback

### Database Resets on Deploy
- Expected behavior (ephemeral filesystem)
- Use Railway Volume for persistence
- Or migrate to PostgreSQL addon

## Advanced Configuration

### Custom Domain
1. Railway dashboard → Settings → Domains
2. Add custom domain
3. Update DNS records as instructed

### Auto-Deploy on Git Push
Railway automatically deploys on:
- Push to `main` branch (default)
- Configure branch in Settings → Deploy

### Multiple Environments
Create separate Railway services:
- `machine-hmi-dev` (deploys from `develop` branch)
- `machine-hmi-prod` (deploys from `main` branch)

### Scaling
Railway automatically scales based on resources:
- Default: 512MB RAM, 1 vCPU
- Upgrade: Settings → Resources

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month (includes $5 credit)
- **Pay-as-you-go**: ~$0.002/min runtime
- Estimated cost: ~$5-10/month for small HMI

## Security Checklist

- [ ] Change default PINs (`OPERATOR_PIN`, `MAINTENANCE_PIN`)
- [ ] Generate strong `JWT_SECRET` (min 32 characters)
- [ ] Enable HTTPS (automatic with Railway)
- [ ] Review CORS settings if needed
- [ ] Set `NODE_ENV=production`
- [ ] Monitor logs for suspicious activity

## Support

- Railway Docs: https://docs.railway.app
- Project README: [README.md](./README.md)
- Issues: GitHub Issues tab

## Migration from Raspberry Pi

If migrating from local Raspberry Pi:

1. Export configuration from `.env`
2. Set same values in Railway environment variables
3. Test with mock mode first
4. Configure VPN/tunnel if PLC access needed
5. Consider hybrid approach: Railway for web, RPi for OPC UA
