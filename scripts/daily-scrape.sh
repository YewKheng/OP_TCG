#!/bin/bash
# Daily scrape script for cron job
# Runs scrape:all, commits and pushes updated data

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Log file with date
LOG_FILE="$PROJECT_DIR/logs/scrape-$(date +%Y-%m-%d).log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Log start time
echo "=========================================" >> "$LOG_FILE"
echo "Daily scrape started at $(date)" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"

# Run the scrape:all script
npm run scrape:all >> "$LOG_FILE" 2>&1
SCRAPE_EXIT_CODE=$?

# Log scrape completion
echo "=========================================" >> "$LOG_FILE"
echo "Scrape completed at $(date)" >> "$LOG_FILE"
echo "Exit code: $SCRAPE_EXIT_CODE" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"

# Only commit and push if scrape was successful (or partially successful)
if [ $SCRAPE_EXIT_CODE -eq 0 ] || [ -f "data/scraped-data.json" ]; then
    echo "Checking for changes..." >> "$LOG_FILE"
    
    # Configure git
    git config user.email "scraper@localhost"
    git config user.name "Daily Scraper"
    
    # Add the data file
    git add data/scraped-data.json
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo "No changes detected in data/scraped-data.json" >> "$LOG_FILE"
    else
        echo "Changes detected, committing..." >> "$LOG_FILE"
        COMMIT_MSG="Daily scrape update - $(date +'%Y-%m-%d %H:%M:%S MYT')"
        git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
        
        if [ $? -eq 0 ]; then
            echo "Pushing to remote..." >> "$LOG_FILE"
            git push >> "$LOG_FILE" 2>&1
            
            if [ $? -eq 0 ]; then
                echo "✅ Successfully committed and pushed changes" >> "$LOG_FILE"
            else
                echo "❌ Failed to push changes" >> "$LOG_FILE"
            fi
        else
            echo "❌ Failed to commit changes" >> "$LOG_FILE"
        fi
    fi
else
    echo "⚠️ Scrape failed or data file not found, skipping commit" >> "$LOG_FILE"
fi

# Log end time
echo "=========================================" >> "$LOG_FILE"
echo "Daily scrape finished at $(date)" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

