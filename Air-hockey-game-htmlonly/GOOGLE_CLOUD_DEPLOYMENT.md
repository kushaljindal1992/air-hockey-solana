# Google Cloud Deployment Guide

This guide will help you deploy your Air Hockey game to Google Cloud Platform (App Engine).

## Prerequisites

- Google Cloud account (you already have this ✓)
- Node.js installed locally
- gcloud CLI installed

## Step 1: Install Google Cloud CLI

### For Windows:

1. Download the installer from: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow the prompts
3. After installation, open a new PowerShell terminal and verify:
   ```powershell
   gcloud --version
   ```

### For WSL/Ubuntu:

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud --version
```

## Step 2: Initialize and Authenticate

1. **Login to your Google Cloud account:**
   ```powershell
   gcloud auth login
   ```
   This will open a browser window for authentication.

2. **Create a new project (or select existing):**
   ```powershell
   gcloud projects create air-hockey-game-[UNIQUE-ID] --name="Air Hockey Game"
   ```
   Replace `[UNIQUE-ID]` with something unique (e.g., your name or random numbers).

3. **Set the project as default:**
   ```powershell
   gcloud config set project air-hockey-game-[UNIQUE-ID]
   ```

4. **Link billing account:**
   - Go to: https://console.cloud.google.com/billing
   - Link your billing account to the project
   - Or use command:
   ```powershell
   gcloud alpha billing accounts list
   gcloud alpha billing projects link air-hockey-game-[UNIQUE-ID] --billing-account=[BILLING-ACCOUNT-ID]
   ```

## Step 3: Enable Required APIs

```powershell
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 4: Initialize App Engine

```powershell
gcloud app create --region=us-central
```

**Available regions:**
- `us-central` (Iowa)
- `us-west2` (Los Angeles)
- `us-east1` (South Carolina)
- `europe-west` (Belgium)
- `asia-southeast1` (Singapore)

Choose the region closest to your target users.

## Step 5: Update Configuration (if needed)

The `app.yaml` file has been created for you. Review it:

```yaml
runtime: nodejs20
instance_class: F2
env_variables:
  NODE_ENV: "production"
```

You can adjust:
- **instance_class**: F1 (smallest/cheapest), F2, F4, F4_1G
- **scaling**: Add automatic_scaling or basic_scaling if needed

## Step 6: Deploy the Application

1. **Navigate to your game directory:**
   ```powershell
   cd \\wsl.localhost\Ubuntu\home\pratham\escrow-fee\Air-hockey-game-htmlonly
   ```

2. **Install dependencies (if not already done):**
   ```powershell
   npm install
   ```

3. **Deploy to Google Cloud:**
   ```powershell
   gcloud app deploy
   ```

4. **When prompted:**
   - Confirm the deployment by typing `Y`
   - Wait for deployment (usually 5-10 minutes)

## Step 7: View Your Application

```powershell
gcloud app browse
```

This will open your deployed game in a browser!

Your app URL will be: `https://air-hockey-game-[UNIQUE-ID].uc.r.appspot.com`

## Step 8: Monitor and Manage

### View logs:
```powershell
gcloud app logs tail -s default
```

### View in console:
```powershell
gcloud app open-console
```

Or visit: https://console.cloud.google.com/appengine

### Deploy updates:
After making changes, simply run:
```powershell
gcloud app deploy
```

## Cost Management

### Free Tier (Daily):
- 28 instance hours (F1/F2 class)
- 1 GB outgoing traffic
- 1 GB incoming traffic

### Monitor costs:
https://console.cloud.google.com/billing

### Stop the app to avoid charges:
```powershell
gcloud app versions stop [VERSION-ID]
```

To find version ID:
```powershell
gcloud app versions list
```

## Troubleshooting

### 1. WebSocket connection issues
If you encounter WebSocket issues, you may need to update `server.js` to handle proxy headers:

```javascript
const io = socketIo(server, {
  transports: ['websocket', 'polling'],
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

### 2. Port configuration
App Engine automatically sets the PORT environment variable. Your server.js already handles this:
```javascript
const PORT = process.env.PORT || 3000;
```

### 3. View deployment errors:
```powershell
gcloud app logs read --limit 100
```

### 4. Check app status:
```powershell
gcloud app describe
```

## Alternative: Deploy with Cloud Run (More Cost-Effective)

If you want even more control and potentially lower costs:

1. **Create Dockerfile** (I can help with this)
2. **Build and deploy to Cloud Run**
3. **Benefits**: Pay only for actual usage, auto-scales to zero

Let me know if you want Cloud Run instructions!

## Environment Variables

If you need to add environment variables:

1. Edit `app.yaml`:
```yaml
env_variables:
  NODE_ENV: "production"
  CUSTOM_VAR: "value"
```

2. Redeploy

## Custom Domain (Optional)

1. Verify domain ownership in Google Search Console
2. Add custom domain in App Engine settings:
   ```powershell
   gcloud app domain-mappings create www.yourdomain.com
   ```

## Next Steps

1. ✅ Install gcloud CLI
2. ✅ Authenticate and create project
3. ✅ Enable billing
4. ✅ Deploy app
5. 🎮 Play your game online!

## Support

- Google Cloud Documentation: https://cloud.google.com/appengine/docs
- Pricing Calculator: https://cloud.google.com/products/calculator
- Support: https://cloud.google.com/support

---

**Quick Deploy Command (after initial setup):**
```powershell
cd \\wsl.localhost\Ubuntu\home\pratham\escrow-fee\Air-hockey-game-htmlonly; gcloud app deploy --quiet
```
