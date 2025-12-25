# Cloud Run Deployment - Successful ✓

## Deployment Summary

**Date:** December 23, 2025  
**Status:** Successfully Deployed  
**Service:** Air Hockey Multiplayer Game

## Configuration

- **Project ID:** psquared-463805
- **Project Number:** 582546076
- **Service Name:** air-hockey-v6-server
- **Region:** asia-south2 (Mumbai, India)
- **Platform:** Google Cloud Run
- **Runtime:** Node.js 20

## Service URL

🌐 **Live Application:**  
https://air-hockey-v6-server-582546076.asia-south2.run.app

## Deployment Details

### Docker Image
- **Image:** gcr.io/psquared-463805/air-hockey-v6-server:latest
- **Build ID:** 79a521f6-8f15-4c02-841a-3cb76d2b2f0a
- **Build Time:** ~30 seconds
- **Image Size:** ~16.9 MB

### Cloud Run Configuration
- **Memory:** 512 MB
- **CPU:** 1 vCPU
- **Port:** 8080
- **Min Instances:** 0 (scales to zero)
- **Max Instances:** 10
- **Authentication:** Public (unauthenticated access)

### Revision
- **Latest Revision:** air-hockey-v6-server-00003-qrx
- **Traffic:** 100%

## Files Created

1. **Dockerfile** - Container configuration for Node.js app
2. **.dockerignore** - Excludes unnecessary files from Docker build
3. **.gitignore** - Git ignore patterns
4. **deploy-cloudrun.ps1** - Automated deployment script

## How to Redeploy

### Option 1: Using the Deployment Script
```powershell
cd "c:\Users\bikash kumar yadav\Desktop\air-hockey-6\Air-hockey-game-htmlonly"
.\deploy-cloudrun.ps1
```

### Option 2: Manual Commands
```powershell
# Navigate to app directory
cd "c:\Users\bikash kumar yadav\Desktop\air-hockey-6\Air-hockey-game-htmlonly"

# Build Docker image
gcloud builds submit --tag gcr.io/psquared-463805/air-hockey-v6-server --project=psquared-463805

# Deploy to Cloud Run
gcloud run deploy air-hockey-v6-server \
    --image gcr.io/psquared-463805/air-hockey-v6-server:latest \
    --platform managed \
    --region asia-south2 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --project psquared-463805
```

## Useful Commands

### View Logs
```powershell
gcloud run services logs read air-hockey-v6-server --region=asia-south2 --project=psquared-463805 --limit=50
```

### Service Details
```powershell
gcloud run services describe air-hockey-v6-server --region=asia-south2 --project=psquared-463805
```

### List All Revisions
```powershell
gcloud run revisions list --service=air-hockey-v6-server --region=asia-south2 --project=psquared-463805
```

### Update Configuration (e.g., increase memory)
```powershell
gcloud run services update air-hockey-v6-server --memory 1Gi --region=asia-south2 --project=psquared-463805
```

### Delete Service
```powershell
gcloud run services delete air-hockey-v6-server --region=asia-south2 --project=psquared-463805
```

## Cost Optimization

Cloud Run pricing (Mumbai region):
- **CPU:** $0.000024 per vCPU-second
- **Memory:** $0.0000025 per GiB-second
- **Requests:** $0.40 per million requests
- **Free Tier:** 2 million requests/month, 360,000 GiB-seconds, 180,000 vCPU-seconds

With min-instances set to 0, the service scales to zero when not in use, minimizing costs.

## Features Deployed

✓ Real-time multiplayer gameplay with Socket.IO  
✓ WebSocket support for low-latency communication  
✓ Static file serving (HTML, CSS, JS, images, audio)  
✓ Admin dashboard  
✓ Blockchain integration (Web3/Solana)  
✓ Auto-scaling based on traffic  

## Monitoring

- **Cloud Console:** https://console.cloud.google.com/run/detail/asia-south2/air-hockey-v6-server/metrics?project=psquared-463805
- **Logs:** Available in Cloud Logging

## Next Steps

1. Test the application at the live URL
2. Monitor performance and logs
3. Set up custom domain (optional)
4. Configure CI/CD pipeline (optional)
5. Enable Cloud CDN for static assets (optional)

## Support

For issues or questions:
- Check logs: `gcloud run services logs read air-hockey-v6-server --region=asia-south2 --project=psquared-463805`
- View Cloud Console: https://console.cloud.google.com/run?project=psquared-463805
- Documentation: https://cloud.google.com/run/docs

---

**Deployment completed successfully!** 🎉
