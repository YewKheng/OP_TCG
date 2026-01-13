# Manual Scraping Guide

Since GitHub Actions IP addresses are blocked by yuyu-tei.jp (403 Forbidden), you'll need to run the scraping manually on your local machine.

## Quick Start

### 1. Run the Scrape

Scrape all search terms (takes ~2-3 hours):

```bash
npm run scrape:all
```

Or scrape a specific term:

```bash
npm run scrape OP01
```

### 2. Commit and Push

After scraping completes, commit and push the updated data:

```bash
git add data/scraped-data.json
git commit -m "Update scraped data - $(date +'%Y-%m-%d %H:%M:%S')"
git push
```

### 3. Vercel Auto-Deploys

Once you push to GitHub, Vercel will automatically detect the change and deploy the updated data.

## Recommended Schedule

Run this **daily at 6 AM Malaysia Time** (or whenever convenient):

1. Open terminal
2. Navigate to project: `cd /Users/Kheng/Documents/OPTCG`
3. Run: `npm run scrape:all`
4. Wait for completion (~2-3 hours)
5. Commit and push: `git add data/scraped-data.json && git commit -m "Daily scrape update" && git push`

## Tips

- **Run overnight**: Start the scrape before bed, commit in the morning
- **Check before committing**: Verify the scrape completed successfully
- **Partial updates**: If some terms fail, you can re-run just those terms:
  ```bash
  npm run scrape OP01  # Re-scrape just OP01
  ```

## Troubleshooting

### Scrape fails with 403?

- Your local IP might be temporarily blocked
- Wait a few hours and try again
- Or use a VPN

### Want to automate locally?

You can set up a local cron job, but your computer must be on at the scheduled time. See your system's cron documentation for setup instructions.
