# Cron Job Setup Guide

## Overview

This guide shows you how to set up a cron job to automatically scrape data daily at 3 AM. Since the scraping runs server-side, there are **no CORS issues** and **no paid subscriptions needed**.

## ⚠️ Important: "Run Locally" Means Your Computer Must Be On

**"Run locally"** means running the cron job on your personal computer. This means:
- ✅ **Your computer must be ON and running** at 3 AM for the cron job to execute
- ✅ **Your computer must not sleep/hibernate** at that time
- ❌ If your computer is off or sleeping, the cron job **won't run**

If you don't want to keep your computer on 24/7, see the **Cloud Options** below.

## Important Notes

### ✅ No CORS Issues
- CORS is a **browser-only** security feature
- Server-side scripts (Node.js) are **not affected** by CORS
- Your cron job will work perfectly without any CORS concerns

### ✅ No Paid Subscriptions Required
- The script uses `axios` directly (free, open-source)
- No proxy services needed
- No API keys required
- **However**, be aware of:
  - **Rate limiting**: yuyu-tei.jp may limit requests if you scrape too frequently
  - **IP blocking**: If you scrape too aggressively, your IP might get temporarily blocked
  - **Server costs**: Only if you run on a cloud service (running locally is free)

### ⚠️ Rate Limiting Considerations

The script already includes delays between requests:
- 200ms delay between individual card page requests
- 1 second delay between batches
- 2 seconds delay between search terms

Running once daily at 3 AM should be safe, but monitor for any 403 errors.

## Setup Instructions

### Option 1: Run on Your Local Machine (Free, but requires computer to be on)

**⚠️ Requirement**: Your computer must be **ON and awake** at 3 AM daily.

1. **Make the script executable** (already done):
   ```bash
   chmod +x scripts/cron-scrape.sh
   ```

2. **Open your crontab**:
   ```bash
   crontab -e
   ```

3. **Add the cron job** (runs daily at 3 AM):
   ```bash
   0 3 * * * /Users/Kheng/Documents/OPTCG/scripts/cron-scrape.sh
   ```
   
   **Note**: Replace `/Users/Kheng/Documents/OPTCG` with your actual project path.

4. **Verify the cron job**:
   ```bash
   crontab -l
   ```

### Option 2: Run on a Cloud Server (Paid, but computer can be off)

**✅ Best option if you don't want to keep your computer on 24/7**

If you want to run it on a cloud server (e.g., AWS EC2, DigitalOcean, etc.):

1. **Set up a VPS** (starts around $5/month):
   - **DigitalOcean Droplet**: $5-6/month (1GB RAM, 1 vCPU)
   - **AWS EC2 t3.micro**: ~$7/month (free tier available for 1 year)
   - **Linode**: $5/month
   - **Vultr**: $5/month
2. **Clone your repository** to the server
3. **Install Node.js** and dependencies
4. **Set up the cron job** as shown above
5. **Server runs 24/7** - no need to keep your computer on

**Pros**: 
- Computer can be off
- More reliable (server always on)
- Can handle multiple cron jobs

**Cons**: 
- Costs ~$5-7/month

### Option 3: Use GitHub Actions (Free, computer can be off)

**✅ Best FREE option if you don't want to keep your computer on**

GitHub Actions can run your scrape job daily, and it's **completely free** (with limits):

1. Create `.github/workflows/daily-scrape.yml`:
   ```yaml
   name: Daily Scrape
   on:
     schedule:
       - cron: '0 3 * * *'  # 3 AM UTC daily (adjust timezone as needed)
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
         - run: npm run scrape:all
         - name: Commit and push changes
           run: |
             git config --local user.email "action@github.com"
             git config --local user.name "GitHub Action"
             git add data/scraped-data.json
             git commit -m "Auto-update scraped data [skip ci]" || exit 0
             git push
   ```

2. **Push to GitHub** - the workflow will run automatically

**Pros**: 
- ✅ **100% FREE** (2000 minutes/month free, plenty for daily scraping)
- ✅ Computer can be off
- ✅ No server management needed
- ✅ Automatic - runs in the cloud

**Cons**: 
- Requires repo to be **public** (or GitHub Pro for private repos)
- Data file gets committed to Git (but that's fine, you already removed it from .gitignore)
- 2000 minutes/month free limit (should be plenty for daily scraping)

**Note**: The cron time is in UTC. If you want 3 AM in your timezone, adjust accordingly (e.g., `0 19 * * *` for 3 AM JST = 7 PM UTC previous day).

## Testing the Cron Job

1. **Test the script manually**:
   ```bash
   ./scripts/cron-scrape.sh
   ```

2. **Check the logs**:
   ```bash
   tail -f logs/scrape-$(date +%Y-%m-%d).log
   ```

3. **Test with a future time** (e.g., 2 minutes from now):
   ```bash
   # Add this to crontab temporarily for testing
   */2 * * * * /Users/Kheng/Documents/OPTCG/scripts/cron-scrape.sh
   ```

## Monitoring

- **Check logs daily**: `logs/scrape-YYYY-MM-DD.log`
- **Monitor for 403 errors**: If you see "403 Forbidden", you may need to:
  - Increase delays between requests
  - Use a VPN or proxy
  - Reduce the number of search terms scraped per day

## Troubleshooting

### Cron job not running?
- Check cron service is running: `sudo service cron status` (Linux) or check System Preferences (macOS)
- Verify the path in crontab is absolute (not relative)
- Check cron logs: `/var/log/syslog` (Linux) or Console.app (macOS)

### Getting 403 errors?
- The website may be rate-limiting you
- Try increasing delays in `scripts/scrape.ts`
- Consider scraping fewer terms per day
- Use a VPN if your IP is blocked

### Script not found?
- Make sure the path in crontab is correct
- Use absolute paths, not relative paths
- Ensure the script has execute permissions: `chmod +x scripts/cron-scrape.sh`

## Recommended Schedule

For 61 search terms (OP01-OP20, EB01-EB10, ST01-ST30, P-):
- **Once daily at 3 AM**: Safe, gives website time to update
- **Estimated time**: ~2-3 hours for all terms
- **Bandwidth**: ~100-200MB per full scrape

## Alternative: Incremental Updates

Instead of scraping everything daily, you could:
- Scrape only new/changed sets weekly
- Scrape popular sets (OP01-OP10) daily
- Scrape less popular sets (ST20-ST30) weekly

Modify `scripts/scrape-all.ts` to customize which terms to scrape.

