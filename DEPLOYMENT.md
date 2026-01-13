# Vercel Deployment Guide

## Important: Data File Inclusion

The `data/scraped-data.json` file is currently in `.gitignore`. For Vercel deployment to work, you need to include this file in your Git repository.

## Option 1: Commit the Data File (Recommended)

1. Remove `data/` from `.gitignore`:
   ```bash
   # Edit .gitignore and remove or comment out the line: data/
   ```

2. Commit the data file:
   ```bash
   git add data/scraped-data.json
   git commit -m "Add scraped data for Vercel deployment"
   ```

3. Push to your repository:
   ```bash
   git push
   ```

## Option 2: Use Vercel CLI with Include Files

If you prefer not to commit the data file, you can use Vercel CLI and include it during deployment:

```bash
vercel --prod
```

However, this requires the file to be present locally during deployment.

## Deployment Steps

1. **Ensure Git author has Vercel access:**
   - Go to your Vercel project settings
   - Add the Git author (`Kheng-PWG`) as a collaborator
   - Or ensure your Git commits use an email that has access

2. **Deploy via Vercel Dashboard:**
   - Connect your Git repository to Vercel
   - Vercel will automatically deploy on push

3. **Or deploy via CLI:**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

## Configuration Files

- `vercel.json` - Configured with:
  - Build command: `npm run build`
  - Output directory: `dist`
  - API functions with 60s timeout and 1024MB memory
  - CORS headers for API routes

- `api/search.ts` - Serverless function that serves cached data

## Notes

- The local `server/index.ts` is only for development and won't be used in Vercel
- All API requests will go through `/api/search` serverless function
- The data file (~1.3MB) will be included in the serverless function bundle

