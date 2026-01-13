# Scraping Setup Guide

This guide explains how to set up local scraping to avoid CORS issues and improve performance.

## Overview

Instead of scraping in real-time (which is slow and unreliable due to CORS and proxy limitations), we now:

1. Scrape data locally using standalone scripts
2. Store the data in a JSON file (`data/scraped-data.json`)
3. Serve cached data through fast APIs
4. Update the cache manually when needed

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

## Manual Updates

Run scraping manually when you need to update the data:

```bash
# Scrape all search terms
npm run scrape:all

# Or scrape specific terms
npm run scrape OP01
npm run scrape OP02
```

After scraping, commit and push the updated data:

```bash
git add data/scraped-data.json
git commit -m "Update scraped data"
git push
```

## Important Notes

### CORS and Server-Side Scraping

**CORS (Cross-Origin Resource Sharing) is a browser security feature.** When you run scraping scripts locally (via command line), you're making server-to-server requests, which **do not encounter CORS restrictions**.

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

This means the search term hasn't been scraped yet. Run:

```bash
npm run scrape <term>
```

### Data Not Updating

- Verify the script works manually: `npm run scrape <term>`
- Check if the data file was saved: `ls -lh data/scraped-data.json`
- Make sure to commit and push after scraping

## Migration from Old System

The old system used ScraperAPI proxy which was slow and unreliable. The new system:

- ✅ Uses cached data (instant responses)
- ✅ Falls back to scraping if cache is empty
- ✅ Manual updates when needed
- ✅ No CORS issues for server-side scraping

Your existing frontend code will automatically use cached data when available, so no frontend changes are needed (though we've optimized it to prefer cached data).
