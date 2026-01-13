# Local Cron Job Setup Guide

This guide shows you how to set up a cron job on your Mac to automatically scrape data daily at 4 PM Malaysia Time.

## ⚠️ Important Requirements

- **Your computer must be ON** at 4 PM Malaysia Time daily
- **Your computer must not be sleeping** at that time
- If your computer is off or sleeping, the cron job won't run

## Setup Instructions

### 1. Make the Script Executable

The script is already executable, but verify:

```bash
chmod +x scripts/daily-scrape.sh
```

### 2. Test the Script Manually

Before setting up the cron job, test it:

```bash
./scripts/daily-scrape.sh
```

This will:
- Run the scrape
- Commit changes (if any)
- Push to GitHub
- Create a log file in `logs/scrape-YYYY-MM-DD.log`

### 3. Set Up the Cron Job

**4 PM Malaysia Time (MYT, UTC+8) = 8 AM UTC**

Open your crontab:

```bash
crontab -e
```

Add this line (replace `/Users/Kheng/Documents/OPTCG` with your actual project path):

```bash
0 8 * * * /Users/Kheng/Documents/OPTCG/scripts/daily-scrape.sh
```

**Note**: Cron uses UTC time, so:
- 4 PM MYT = 8 AM UTC (16:00 - 8:00 = 08:00)

### 4. Verify the Cron Job

Check that it was added:

```bash
crontab -l
```

You should see:
```
0 8 * * * /Users/Kheng/Documents/OPTCG/scripts/daily-scrape.sh
```

### 5. Ensure Your Mac Stays Awake

**Option A: Use `caffeinate` (Recommended)**

Modify the cron job to prevent sleep:

```bash
0 8 * * * caffeinate -i /Users/Kheng/Documents/OPTCG/scripts/daily-scrape.sh
```

**Option B: System Settings**

1. Go to **System Settings** → **Battery** (or **Energy Saver**)
2. Set **Prevent automatic sleeping on power adapter when display is off** to ON
3. Keep your Mac plugged in

**Option C: Use `pmset`**

Prevent sleep during the scrape time:

```bash
# Prevent sleep from 7:50 AM to 11:00 AM UTC (3:50 PM to 7:00 PM MYT)
0 7 * * * pmset noidle
0 11 * * * pmset idle
```

## What the Script Does

1. **Runs the scrape**: Executes `npm run scrape:all`
2. **Checks for changes**: Only commits if data changed
3. **Commits changes**: Creates a commit with timestamp
4. **Pushes to GitHub**: Automatically pushes to trigger Vercel deployment
5. **Logs everything**: Creates daily log files in `logs/` directory

## Monitoring

### Check Logs

View today's log:

```bash
tail -f logs/scrape-$(date +%Y-%m-%d).log
```

View all logs:

```bash
ls -lh logs/
```

### Check Cron Job Status

```bash
# View cron jobs
crontab -l

# Check cron service (macOS)
sudo launchctl list | grep cron
```

### Verify Git Commits

Check if commits are being made:

```bash
git log --oneline --grep="Daily scrape"
```

## Troubleshooting

### Cron Job Not Running?

1. **Check cron service**:
   ```bash
   sudo launchctl list | grep cron
   ```

2. **Check system logs**:
   ```bash
   log show --predicate 'process == "cron"' --last 1h
   ```

3. **Verify path**: Make sure the path in crontab is absolute (not relative)

4. **Check permissions**: Ensure the script is executable:
   ```bash
   ls -l scripts/daily-scrape.sh
   ```

### Script Runs But Doesn't Commit?

- Check if `data/scraped-data.json` exists
- Check if there are actual changes (maybe data is identical)
- Check the log file for error messages

### Script Runs But Doesn't Push?

- Check if you have git credentials configured
- Check if you have push access to the repository
- Check the log file for git errors

### Computer Sleeps During Scrape?

- Use `caffeinate` in the cron job (see Option A above)
- Or keep your Mac plugged in with sleep prevention enabled

## Alternative: Use `launchd` (macOS Native)

Instead of cron, you can use macOS's `launchd` which is more reliable on macOS:

1. Create `~/Library/LaunchAgents/com.optcg.dailyscrape.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.optcg.dailyscrape</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/Kheng/Documents/OPTCG/scripts/daily-scrape.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/Kheng/Documents/OPTCG/logs/launchd-scrape.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/Kheng/Documents/OPTCG/logs/launchd-scrape-error.log</string>
</dict>
</plist>
```

2. Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.optcg.dailyscrape.plist
```

3. Check status:

```bash
launchctl list | grep optcg
```

**Note**: `launchd` also uses UTC time, so 4 PM MYT = 8 AM UTC.

## Summary

- ✅ **Cron job**: Runs daily at 4 PM MYT (8 AM UTC)
- ✅ **Automatic**: Scrapes, commits, and pushes automatically
- ✅ **Logging**: Creates daily log files
- ⚠️ **Requirement**: Computer must be on and awake at 4 PM MYT

That's it! Your scraping will now run automatically every day at 4 PM Malaysia Time.

