# Proxy Setup Guide

This application uses proxy services to bypass 403 Forbidden errors when scraping websites.

## Option 1: ScraperAPI (Recommended - Free Tier Available)

1. **Sign up for ScraperAPI**:

   - Go to https://www.scraperapi.com/
   - Sign up for a free account (1,000 requests/month free)

2. **Get your API key**:

   - After signing up, go to your dashboard
   - Copy your API key

3. **Add to Vercel Environment Variables**:

   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add a new variable:
     - **Name**: `SCRAPERAPI_KEY`
     - **Value**: Your ScraperAPI API key
   - Select all environments (Production, Preview, Development)
   - Click "Save"

4. **Redeploy**:
   - The changes will take effect on the next deployment
   - Or trigger a redeploy from the Vercel dashboard

## Option 2: Custom Proxy URL

If you have your own proxy server, you can use it instead:

1. **Add to Vercel Environment Variables**:

   - **Name**: `PROXY_URL`
   - **Value**: Your proxy URL (e.g., `http://proxy.example.com:8080`)
   - Select all environments
   - Click "Save"

2. **Redeploy**

## How It Works

- If `SCRAPERAPI_KEY` is set, the app will use ScraperAPI proxy
- If `PROXY_URL` is set, the app will use your custom proxy
- If neither is set, it will try direct requests (may get 403 errors)

## Testing Locally

For local development, create a `.env.local` file in the root directory:

```env
SCRAPERAPI_KEY=your_api_key_here
```

Or:

```env
PROXY_URL=http://your-proxy-url:port
```

**Note**: The `.env.local` file is already in `.gitignore`, so it won't be committed to your repository.

## Alternative Proxy Services

If ScraperAPI doesn't work for you, here are other options:

1. **ScrapingBee** (https://www.scrapingbee.com/) - Free tier available
2. **Bright Data** (https://brightdata.com/) - More expensive but very reliable
3. **ProxyAPI** (https://www.proxyapi.com/) - Simple proxy service

To use a different service, you'll need to modify the `fetchWithProxy` function in `api/search.ts` to match their API format.
