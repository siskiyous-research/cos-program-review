# Deployment Guide

Deploy the Program Review Assistant to Vercel with zero downtime.

## Prerequisites

- GitHub account (free)
- Vercel account (free)
- Google Gemini API key
- This Next.js app repository

## Step-by-Step Deployment

### 1. Push Code to GitHub

First, ensure your code is in a GitHub repository:

```bash
cd /Users/clawdbot/.openclaw/workspace/program-review-app

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Program Review Assistant with ACCJC integration"

# Create a new repo on GitHub (via web UI)
# Then add remote and push
git remote add origin https://github.com/YOUR_USERNAME/program-review-app.git
git branch -M main
git push -u origin main
```

**Important:** Repository must be public or Vercel must have access.

### 2. Connect to Vercel

#### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Sign in with GitHub (or create account)
3. Click **"New Project"**
4. Select **"Import Git Repository"**
5. Search for `program-review-app`
6. Click **Import**

#### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Deploy to production when ready
```

### 3. Configure Environment Variables

After importing on Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add the following:

| Variable Name | Value |
|---|---|
| `GEMINI_API_KEY` | `your_actual_api_key_here` |

3. Click **"Save"**

⚠️ **Security Note:** Never commit `.env.local` to GitHub. Vercel secrets are encrypted and secure.

### 4. Deploy

Vercel will automatically deploy after you connect GitHub. To trigger a new deployment:

```bash
# Option 1: Push code to GitHub (automatic)
git add .
git commit -m "Your commit message"
git push origin main

# Option 2: Manual deploy via CLI
vercel --prod
```

### 5. Verify Deployment

1. Check Vercel dashboard for build status
2. Once "Ready", click the deployment URL
3. Test the app:
   - Select a program
   - Click "Generate Executive Summary"
   - Verify API calls work

## Custom Domain

### Add a Custom Domain to Your Vercel Deployment

1. In Vercel **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `program-review.colleges.edu`)
4. Choose one:
   - **Vercel Nameservers** (easiest)
   - **CNAME** (if you manage DNS elsewhere)
5. Follow the DNS configuration instructions
6. Wait 24-48 hours for DNS propagation

### DNS Configuration (If Not Using Vercel Nameservers)

If your domain is managed elsewhere (GoDaddy, AWS Route 53, etc.):

1. Add CNAME record pointing to: `cname.vercel.com`
2. Alternatively, add A record: `76.76.19.0` (see Vercel docs for latest)

## Environment & Configuration

### Build Settings

Vercel auto-detects Next.js. Default settings usually work:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Node Version

If you need to specify Node version, add `package.json`:

```json
{
  "engines": {
    "node": "20.x"
  }
}
```

## Monitoring & Logs

### View Deployment Logs

1. Go to Vercel **Deployments** tab
2. Click on a deployment
3. View build logs and runtime logs
4. Look for errors under **Function Logs**

### Real-Time Monitoring

1. **Analytics**: Vercel dashboard → **Analytics**
   - Page views
   - Response times
   - Error rates

2. **Error Tracking**:
   - Check Next.js error logs
   - Browser DevTools (user side errors)
   - Vercel Function Logs (API errors)

## Troubleshooting

### "GEMINI_API_KEY is not set"

**Problem**: API calls failing with API key error.

**Solution**:
1. Verify environment variable is set in Vercel **Settings** → **Environment Variables**
2. Redeploy after adding the variable:
   ```bash
   git add .
   git commit -m "Trigger redeploy"
   git push origin main
   ```

### Build Fails with TypeScript Errors

**Problem**: Build fails with type errors.

**Solution**:
1. Check Vercel logs for specific error
2. Fix locally: `npm run build`
3. Commit and push fix: `git add . && git commit -m "Fix build" && git push`

### API Routes Return 500 Error

**Problem**: `/api/generate-program-data` or other endpoints fail.

**Solution**:
1. Check Vercel Function Logs (Deployments → Logs)
2. Ensure `GEMINI_API_KEY` is set
3. Verify API key is valid at: https://makersuite.google.com/app/apikey
4. Check request body matches expected schema

### Cold Start Latency

**Problem**: First request is slow (cold start).

**Note**: This is normal for serverless. Subsequent requests are fast.

**Mitigation**: Vercel has optimizations; no action needed.

## Security Best Practices

### API Key Safety ✅

- ✅ API key stored in Vercel environment variables (encrypted)
- ✅ API key is server-only (never sent to frontend)
- ✅ All Gemini calls go through Next.js API routes
- ✅ Frontend has zero access to the key

### Additional Security

1. **Enable HTTPS**: Vercel does this automatically
2. **Rate Limiting**: Consider adding rate limiting to API routes:
   ```typescript
   // In route.ts
   const remainingRequests = req.headers.get('x-ratelimit-remaining');
   if (remainingRequests === '0') {
     return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
   }
   ```
3. **Environment Variables**: Use Vercel's secret management (don't commit)
4. **CORS**: Configure if needed (unlikely for internal use)

## Rollback

If a deployment has issues:

1. Go to Vercel **Deployments**
2. Find the previous good deployment
3. Click the deployment
4. Click **Promote to Production**

This instantly rolls back to a previous version.

## Updating the App

### Deploy New Version

```bash
# Make changes locally
nano app/page.tsx

# Commit and push
git add .
git commit -m "Update: Add new feature"
git push origin main

# Vercel automatically builds and deploys
```

### Zero-Downtime Deployment

Vercel handles this automatically:
1. New build created
2. Old version still serves traffic
3. When build completes, traffic switches (usually <1s)
4. Users see no downtime

## Performance Optimization

### Image Optimization

If adding images, use Next.js Image component:

```tsx
import Image from 'next/image';

export default function MyComponent() {
  return (
    <Image
      src="/image.png"
      alt="Description"
      width={640}
      height={480}
    />
  );
}
```

### Analytics

Vercel automatically provides:
- Page load times
- Error rates
- API response times
- Regional performance

View in Vercel **Analytics** tab.

## Cost

### Vercel Pricing (as of 2024)

- **Hobby (Free)**: Up to 12 serverless function invocations/month
  - Fine for dev/testing
  - Not suitable for production with regular traffic

- **Pro ($20/month)**: Unlimited serverless function invocations
  - **Recommended for production**
  - Includes analytics, edge middleware, priority support

- **Enterprise**: Custom pricing

### Gemini API Pricing

Check: https://ai.google.dev/pricing

- Free tier available for development
- Pay-as-you-go for production

### Recommendation

For college use:
- Use Vercel Pro ($20/month) for production
- Use free tier for testing
- Monitor Gemini API usage and costs

## Maintenance

### Regular Checks

1. **Weekly**: Check Vercel analytics for errors
2. **Monthly**: Review and update dependencies:
   ```bash
   npm outdated
   npm update
   ```
3. **Monthly**: Test API routes are working
4. **Quarterly**: Review security updates

### Updates

To update dependencies:

```bash
cd /Users/clawdbot/.openclaw/workspace/program-review-app

# Check for outdated packages
npm outdated

# Update all packages
npm update

# Test locally
npm run dev

# If all works, commit and push
git add package*.json
git commit -m "Update dependencies"
git push origin main
```

## Scaling

### Current Architecture

- **Frontend**: Vercel CDN (global, fast)
- **API**: Serverless functions (auto-scales)
- **External APIs**: Google Gemini API

This scales automatically to handle traffic spikes.

### If Needed

- Vercel automatically scales serverless functions
- No configuration needed for typical use
- Contact Vercel support for enterprise scaling

## Support

### Vercel Support

- **Free tier**: Community support
- **Pro**: Email support
- **Enterprise**: Dedicated support

### Google Gemini Support

- Documentation: https://ai.google.dev
- Issues: https://github.com/google/generative-ai-js/issues

## Next Steps

1. **Push code to GitHub** (done in Step 1)
2. **Connect to Vercel** (done in Step 2)
3. **Add GEMINI_API_KEY** (done in Step 3)
4. **Test the deployment** (done in Step 5)
5. **Set up custom domain** (optional)
6. **Monitor and maintain** (ongoing)

---

**Your app is now live!** 🚀

Share the URL with your college and start using the Program Review Assistant in production.
