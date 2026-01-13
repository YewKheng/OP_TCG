# Quick Start - Local Scraping Setup

## Answer to Your Question

**Q: Will cron jobs encounter the same blocking issue?**

**A: No!** CORS (Cross-Origin Resource Sharing) is a **browser-only security feature**. When you run scraping scripts on a server (via cron jobs, Node.js, or command line), you're making server-to-server HTTP requests, which **do not have CORS restrictions**.

However, you may still encounter:

- Rate limiting (too many requests)
- IP blocking (if you scrape too aggressively)
- 403 Forbidden (if the website detects automation)

The scraping script includes delays to minimize these issues.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Scrape Your First Search Term

```bash
npm run scrape 09-118
```

This will:

- Scrape data from yuyu-tei.jp
- Save it to `data/scraped-data.json`
- Take a few minutes (depending on number of cards)

### 3. Start Your Server

```bash
npm run dev:server
```

### 4. Test the API

```bash
# Get cached data
curl http://localhost:3001/api/cached/09-118

# Or use the search API (uses cache automatically)
curl http://localhost:3001/api/search?search_word=09-118
```

### 5. Set Up Daily Cron Job

**On macOS/Linux:**

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /Users/Kheng/Documents/OPTCG && npm run scrape 09-118 >> /Users/Kheng/Documents/OPTCG/logs/scrape.log 2>&1
```

**On Windows:**
Use Task Scheduler to run:

```cmd
cd C:\path\to\OPTCG && npm run scrape 09-118
```

## How It Works

1. **Scraping Script** (`scripts/scrape.ts`): Runs locally, scrapes data, saves to JSON
2. **Data Storage** (`data/scraped-data.json`): Stores all scraped data
3. **Backend APIs**: Serve cached data instantly (no scraping needed)
4. **Frontend**: Automatically uses cached data when available

## Benefits

- ✅ **Fast**: Cached data loads instantly
- ✅ **Reliable**: No CORS issues, no proxy timeouts
- ✅ **Complete**: All data is scraped fully (no partial results)
- ✅ **Cost Effective**: No need for ScraperAPI or proxy services

## Next Steps

1. Add more search terms to `scripts/scrape-all.ts`
2. Set up cron job for automatic daily updates
3. See `SCRAPING_SETUP.md` for detailed documentation
