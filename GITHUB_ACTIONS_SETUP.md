# GitHub Actions Setup Guide

## Quick Setup

1. **Push your code to GitHub** (if not already done):

   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow for daily scraping"
   git push origin main
   ```

2. **Enable GitHub Actions**:

   - Go to your repository on GitHub
   - Click on the **"Actions"** tab
   - If prompted, click **"I understand my workflows, go ahead and enable them"**

3. **Verify the workflow**:
   - Go to **Actions** tab
   - You should see "Daily Scrape" workflow
   - You can manually trigger it by clicking "Run workflow"

## How It Works

- **Automatic**: Runs daily at 3 AM UTC (adjust timezone in `.github/workflows/daily-scrape.yml` if needed)
- **Manual**: You can trigger it anytime from the GitHub Actions tab
- **Free**: Uses GitHub's free tier (2000 minutes/month - plenty for daily scraping)

## Timezone Adjustment

The default is 3 AM UTC. To change it:

1. Edit `.github/workflows/daily-scrape.yml`
2. Change the cron schedule:

   ```yaml
   - cron: "0 3 * * *" # 3 AM UTC
   ```

   Examples:

   - **3 AM JST (Japan)**: `'0 18 * * *'` (6 PM UTC previous day)
   - **3 AM EST (US East)**: `'0 8 * * *'` (8 AM UTC)
   - **3 AM PST (US West)**: `'0 11 * * *'` (11 AM UTC)

## What Happens

1. GitHub Actions runs your scrape script daily
2. Scrapes all search terms (OP01-OP20, EB01-EB10, ST01-ST30, P-)
3. Updates `data/scraped-data.json`
4. Automatically commits and pushes the updated data
5. Your Vercel deployment will use the updated data

## Monitoring

- **View runs**: Go to **Actions** tab → Click on "Daily Scrape"
- **View logs**: Click on any run to see detailed logs
- **Check commits**: The updated data file will appear in your commit history

## Troubleshooting

### Workflow not running?

- Make sure GitHub Actions is enabled in your repository settings
- Check that the workflow file is in `.github/workflows/` directory
- Verify the cron syntax is correct

### Getting 403 errors?

- The website may be rate-limiting GitHub's IP addresses
- Consider reducing the number of search terms or increasing delays
- Check the workflow logs for specific errors

### Data not updating?

- Check the workflow logs for errors
- Verify the commit was pushed successfully
- Make sure `data/scraped-data.json` is not in `.gitignore` (you already removed it)

## Manual Trigger

You can manually trigger the workflow anytime:

1. Go to **Actions** tab
2. Click on **"Daily Scrape"** workflow
3. Click **"Run workflow"** button
4. Select branch and click **"Run workflow"**

## Cost

- **Free**: 2000 minutes/month included
- **Your usage**: ~60-90 minutes per full scrape (61 search terms)
- **Monthly usage**: ~1800-2700 minutes (30 days × 60-90 min)
- **Note**: You might exceed the free tier if scraping takes longer. Consider:
  - Reducing search terms
  - Running every other day instead of daily
  - Or upgrade to GitHub Pro ($4/month) for 3000 minutes/month

## Next Steps

1. Push the workflow file to GitHub
2. Enable Actions in your repository
3. Test it manually first
4. Monitor the first few runs
5. Adjust timezone if needed

That's it! Your scraping will now run automatically in the cloud, and your computer can be off. 🎉
