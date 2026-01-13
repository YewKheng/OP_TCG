# Scraping Setup Guide

This guide explains how to set up local scraping to avoid CORS issues and improve performance.

## Overview

Instead of scraping in real-time (which is slow and unreliable due to CORS and proxy limitations), we now:
1. Scrape data locally using standalone scripts
2. Store the data in a JSON file (`data/scraped-data.json`)
3. Serve cached data through fast APIs
4. Update the cache periodically via cron jobs

## Why This Approach?

- **No CORS Issues**: Server-side scraping doesn't encounter CORS (browser-only security feature)
- **Faster**: Cached data is served instantly
- **More Reliable**: Data is scraped completely without timeouts
- **Cost Effective**: No need for expensive proxy services

## Quick Start

### 1. Manual Scraping

Scrape a single search term:
```bash
npm run scrape 09-118
```

Scrape multiple search terms:
```bash
npm run scrape:all
```

### 2. View Cached Data

The scraped data is stored in `data/scraped-data.json`. You can view it directly or use the API:

```bash
# List all cached search terms
curl http://localhost:3001/api/cached

# Get cached data for a specific search term
curl http://localhost:3001/api/cached/09-118
```

### 3. Frontend Usage

The frontend automatically uses cached data when available. If no cached data exists, it falls back to real-time scraping.

## Setting Up Cron Jobs

### Option 1: Using cron (Linux/macOS)

1. Open your crontab:
```bash
crontab -e
```

2. Add a cron job to scrape daily at 2 AM:
```bash
# Scrape daily at 2 AM
0 2 * * * cd /path/to/OPTCG && npm run scrape 09-118 >> /path/to/OPTCG/logs/scrape.log 2>&1
```

3. For multiple search terms, create a script:
```bash
# Create scripts/daily-scrape.sh
#!/bin/bash
cd /path/to/OPTCG
npm run scrape OP01
npm run scrape OP02
npm run scrape OP03
npm run scrape OP04
npm run scrape OP05
npm run scrape OP06
npm run scrape OP07
npm run scrape OP08
npm run scrape OP09
npm run scrape OP10
npm run scrape OP11
npm run scrape OP12
npm run scrape OP13
npm run scrape OP14
npm run scrape OP15
npm run scrape OP16

npm run scrape EB01
npm run scrape EB02
npm run scrape EB03
npm run scrape EB04

npm run scrape ST01

# Add more as needed
```

Make it executable:
```bash
chmod +x scripts/daily-scrape.sh
```

Then add to crontab:
```bash
0 2 * * * /path/to/OPTCG/scripts/daily-scrape.sh >> /path/to/OPTCG/logs/scrape.log 2>&1
```

### Option 2: Using node-cron (Node.js)

Create a file `scripts/cron-scraper.ts`:

```typescript
import cron from "node-cron";
import { execSync } from "child_process";

// Run daily at 2 AM
cron.schedule("0 2 * * *", () => {
  console.log("Running daily scrape...");
  try {
    execSync("npm run scrape 09-118", { stdio: "inherit" });
    execSync("npm run scrape 09-119", { stdio: "inherit" });
    // Add more as needed
  } catch (error) {
    console.error("Scrape failed:", error);
  }
});
```

Run it:
```bash
tsx scripts/cron-scraper.ts
```

### Option 3: Using GitHub Actions (for cloud-based scraping)

Create `.github/workflows/scrape.yml`:

```yaml
name: Daily Scrape

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run scrape 09-118
      - run: npm run scrape 09-119
      # Add more as needed
      - name: Commit and push data
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/
          git commit -m "Update scraped data" || exit 0
          git push
```

## Important Notes

### CORS and Cron Jobs

**CORS (Cross-Origin Resource Sharing) is a browser security feature.** When you run scraping scripts on a server (via cron jobs, Node.js scripts, or GitHub Actions), you're making server-to-server requests, which **do not encounter CORS restrictions**.

However, you may still encounter:
- **Rate limiting**: The website may limit how many requests you can make
- **IP blocking**: If you make too many requests, your IP might be temporarily blocked
- **403 Forbidden**: Some websites block automated requests

### Best Practices

1. **Add Delays**: The scraping script already includes delays between requests (200ms between requests, 1s between batches)
2. **Respect Rate Limits**: Don't scrape too frequently (once per day is usually fine)
3. **Use VPN if Needed**: If your IP gets blocked, you may need to use a VPN or proxy
4. **Monitor Logs**: Check logs regularly to ensure scraping is working

### Data Storage

- Data is stored in `data/scraped-data.json`
- This file can get large, so it's excluded from git by default (see `.gitignore`)
- For production, consider using a database (PostgreSQL, MongoDB, etc.) instead of JSON

### Updating Search Terms

To add more search terms to scrape:

1. Edit `scripts/scrape-all.ts` and add terms to the `COMMON_SEARCH_TERMS` array
2. Or run individual scrapes: `npm run scrape <term>`

## Troubleshooting

### "403 Forbidden" Error

If you get 403 errors:
- Wait a few hours and try again
- Use a VPN or proxy
- Reduce scraping frequency
- Check if the website structure has changed

### "No cached data found"

This means the search term hasn't been scraped yet. Either:
- Run `npm run scrape <term>` manually
- Wait for the cron job to run
- The API will fall back to real-time scraping (slower)

### Data Not Updating

- Check if cron job is running: `crontab -l`
- Check logs: `tail -f logs/scrape.log`
- Verify the script works manually: `npm run scrape <term>`

## Migration from Old System

The old system used ScraperAPI proxy which was slow and unreliable. The new system:
- ✅ Uses cached data (instant responses)
- ✅ Falls back to scraping if cache is empty
- ✅ Can be updated via cron jobs
- ✅ No CORS issues for server-side scraping

Your existing frontend code will automatically use cached data when available, so no frontend changes are needed (though we've optimized it to prefer cached data).

