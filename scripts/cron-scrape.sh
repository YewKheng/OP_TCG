#!/bin/bash
# Cron job script to scrape all search terms daily at 3 AM
# Make sure to set the correct path to your project

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Log file
LOG_FILE="$PROJECT_DIR/logs/scrape-$(date +%Y-%m-%d).log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Log start time
echo "=========================================" >> "$LOG_FILE"
echo "Scraping started at $(date)" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"

# Run the scrape:all script
npm run scrape:all >> "$LOG_FILE" 2>&1

# Log end time
echo "=========================================" >> "$LOG_FILE"
echo "Scraping completed at $(date)" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

