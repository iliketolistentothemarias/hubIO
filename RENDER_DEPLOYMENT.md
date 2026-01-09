# Render Deployment Fix

## Issue
Render was running `npm run build` without installing dependencies first, causing `next: not found` error.

## Solution

### Option 1: Update Render Dashboard (RECOMMENDED)
1. Go to your Render dashboard
2. Navigate to your hubIO service
3. Go to **Settings** → **Build & Deploy**
4. Change the **Build Command** from `npm run build` to:
   ```
   npm ci && npm run build
   ```
   Or:
   ```
   npm install && npm run build
   ```
5. Save and redeploy

### Option 2: Use render.yaml (if service is created via Infrastructure as Code)
The `render.yaml` file is already configured with the correct build command. If you created your service through the Render dashboard manually, you'll need to either:
- Recreate the service using `render.yaml`, OR
- Update the build command in the dashboard (Option 1)

## Changes Made
1. Added `prebuild` script in `package.json` to ensure dependencies are installed before build
2. Added `.nvmrc` file to specify Node.js version 20
3. Updated `render.yaml` with correct build command
4. Added Node.js engine requirements in `package.json`

## Verify
After updating the build command, the build should:
1. Install dependencies (`npm ci`)
2. Build the Next.js app (`npm run build`)
3. Start the server (`npm start`)
