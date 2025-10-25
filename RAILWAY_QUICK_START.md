# Railway Quick Start - Machine HMI Edge

## 🚀 Deploy in 5 Minutes

### Step 1: Push to Git
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Click **"Deploy Now"**

### Step 3: Configure Environment Variables
In Railway dashboard → Variables, add:

```env
NODE_ENV=production
PORT=8080
JWT_SECRET=your_super_secret_key_min_32_chars
OPERATOR_PIN=1111
MAINTENANCE_PIN=2222
```

⚠️ **Important**: Generate a strong `JWT_SECRET` using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Wait for Build
Railway will automatically:
- ✅ Install dependencies
- ✅ Build React frontend
- ✅ Start Node.js backend
- ✅ Assign public URL

### Step 5: Access Your HMI
1. Click **"Open App"** button in Railway
2. Login with PIN: `1111` (Operator) or `2222` (Maintenance)
3. Select language from dropdown 🌍

## 🎯 What Gets Deployed

```
Railway App (Single Container)
│
├── Backend (Node.js)
│   ├── Express server on PORT
│   ├── WebSocket for real-time data
│   ├── OPC UA client (mock mode by default)
│   ├── SQLite historical database
│   └── JWT authentication
│
└── Frontend (React)
    ├── Served as static files from backend
    ├── Multi-language support (8 languages)
    ├── Real-time dashboard
    ├── Alarms & history views
    └── Commands interface
```

## 📝 Default Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Set to `production` for Railway |
| `PORT` | `8080` | Server port (Railway auto-assigns) |
| `JWT_SECRET` | `change_me_in_production` | ⚠️ Must change for production |
| `OPERATOR_PIN` | `1111` | Operator login PIN |
| `MAINTENANCE_PIN` | `2222` | Maintenance login PIN |
| `OPCUA_ENDPOINT` | Mock mode | Real PLC endpoint (optional) |

## 🔒 Security Checklist

Before going to production:

- [ ] Change `JWT_SECRET` to random 32+ character string
- [ ] Change `OPERATOR_PIN` and `MAINTENANCE_PIN`
- [ ] Set `NODE_ENV=production`
- [ ] Review CORS settings if using custom domain
- [ ] Enable Railway's "Private Networking" if connecting to PLC

## 🌐 Connecting to Real PLC

To connect to your OPC UA PLC, add:

```env
OPCUA_ENDPOINT=opc.tcp://your-plc-ip:4840
```

**Note**: Your PLC must be network-accessible from Railway. Consider:
- VPN/tunnel solution (Tailscale, Cloudflare Tunnel)
- Railway Private Networking
- Or keep Railway for web UI + Raspberry Pi for PLC connection

## 📊 Monitor Your Deployment

### Health Check
```
https://your-app.railway.app/api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "opcua": { "connected": false, "mock": true },
  "websocket": { "clients": 2, "authenticated": 1 }
}
```

### View Logs
Railway dashboard → Your service → **Logs** tab

### Check Metrics
Railway dashboard → **Metrics** tab
- CPU usage
- Memory usage
- Network traffic

## 🛠️ Troubleshooting

### Build Failed
**Error**: `Cannot find module`
- Check `package.json` exists in `frontend/` and `backend/`
- Verify `nixpacks.toml` is in project root

**Solution**: Commit all files and redeploy

### App Crashes on Start
**Error**: `EADDRINUSE: address already in use`
- Check `PORT` environment variable is set correctly
- Railway assigns port automatically

**Solution**: Remove hardcoded port, use `process.env.PORT`

### Cannot Connect to PLC
**Error**: `Connection timeout`
- Verify `OPCUA_ENDPOINT` is correct
- Check network connectivity from Railway
- App automatically falls back to mock mode

**Solution**: Test with mock mode first, then configure networking

### Login Not Working
**Error**: `Invalid PIN`
- Check `OPERATOR_PIN` and `MAINTENANCE_PIN` are set
- Verify no extra spaces in environment variables

**Solution**: Reset variables in Railway dashboard

## 💰 Estimated Costs

Railway pricing (2024):
- **Hobby Plan**: $5/month (includes $5 credit)
- **Usage**: ~$0.002/minute runtime
- **Estimated**: $5-10/month for this HMI app

## 🔄 Auto-Deploy on Push

Railway automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway deploys automatically ✨
```

## 📱 Custom Domain (Optional)

1. Railway dashboard → Settings → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `hmi.yourcompany.com`)
4. Update DNS records as shown
5. Wait for SSL certificate (automatic)

## 🌍 Language Support

The app includes 8 languages:
- 🇬🇧 English
- 🇪🇸 Spanish
- 🇩🇪 German
- 🇮🇹 Italian
- 🇫🇷 French
- 🇵🇱 Polish
- 🇨🇳 Chinese
- 🇯🇵 Japanese

Users can switch language using the flag dropdown in the header.

## 📚 More Information

- **Full Deployment Guide**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Project Documentation**: [README.md](./README.md)
- **Internationalization**: [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md)
- **Quick Start (Local)**: [QUICK_START.md](./QUICK_START.md)

## 🆘 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: GitHub Issues

## ✅ Deployment Checklist

Complete this before deploying:

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] `NODE_ENV=production` set
- [ ] `PORT` configured (or use Railway default)
- [ ] `JWT_SECRET` generated and set
- [ ] PINs changed from defaults
- [ ] Build succeeded
- [ ] App URL accessible
- [ ] Health check returns OK
- [ ] Login works
- [ ] WebSocket connected
- [ ] Mock data visible on dashboard
- [ ] All languages working

🎉 **You're ready to go!**
