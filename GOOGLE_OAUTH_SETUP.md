# Google OAuth Setup Guide

## Error: "Unsupported provider: provider is not enabled"

This error means Google OAuth is not enabled in your Supabase project. Follow these steps to enable it:

## Step 1: Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers** (in the left sidebar)
4. Find **Google** in the list of providers
5. Toggle it to **Enabled**
6. Click **Save**

## Step 2: Get Google OAuth Credentials

### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Enter a project name (e.g., "HubIO Auth")
4. Click **Create**

### Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: HubIO (or your app name)
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue** through the steps
4. Back in Credentials, select **Web application**
5. Name it (e.g., "HubIO Web Client")
6. Add **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   Replace `YOUR_PROJECT_ID` with your Supabase project reference ID (found in your Supabase project settings → API → Project URL)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Google in Supabase

1. Go back to Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** and **Client Secret** from Google Cloud Console
3. Click **Save**

## Step 4: Configure Site URL and Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
4. Click **Save**

## Step 5: Test Google OAuth

1. Go to your login page
2. Click **Continue with Google**
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to your app

## Troubleshooting

### Still getting "provider is not enabled" error?
- Make sure you clicked **Save** after enabling Google in Supabase
- Refresh your browser and try again
- Check that the Google provider toggle is actually ON (green/enabled)

### Redirect URI mismatch error?
- Make sure the redirect URI in Google Cloud Console exactly matches: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Check your Supabase project reference ID in Settings → API

### "Invalid client" error?
- Double-check that you copied the Client ID and Client Secret correctly
- Make sure there are no extra spaces
- Verify the credentials are for the correct Google Cloud project

### Not redirecting after Google sign-in?
- Check that your redirect URLs are added in Supabase (Step 4)
- Make sure the callback URL matches: `http://localhost:3000/auth/callback` (or your production URL)

## Quick Checklist

- [ ] Google provider enabled in Supabase
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created
- [ ] Redirect URI added in Google Cloud Console
- [ ] Client ID and Secret added in Supabase
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs added in Supabase

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Check Supabase logs in Dashboard → Logs → Auth
3. Verify all URLs match exactly (no trailing slashes, correct protocol)

