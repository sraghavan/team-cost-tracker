# 🚀 Vercel Deployment Guide

## Prerequisites
- ✅ Code pushed to GitHub
- ✅ Supabase database set up
- ✅ Supabase credentials ready

## Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub

## Step 2: Import Project
1. Click "New Project" or "Add New..." → "Project"
2. Find your `team-cost-tracker` repository
3. Click "Import" next to it

## Step 3: Configure Deployment
1. **Framework Preset**: Should auto-detect "Create React App" ✅
2. **Root Directory**: Leave as `./` ✅
3. **Build and Output Settings**: 
   - Build Command: `npm run build` ✅
   - Output Directory: `build` ✅
4. **Install Command**: `npm install` ✅

## Step 4: Add Environment Variables
**IMPORTANT**: Before clicking Deploy, add your environment variables:

1. Expand "Environment Variables" section
2. Add these variables:

**Variable 1:**
- Name: `REACT_APP_SUPABASE_URL`
- Value: Your Supabase Project URL (like `https://xxx.supabase.co`)

**Variable 2:**
- Name: `REACT_APP_SUPABASE_ANON_KEY`  
- Value: Your Supabase anon key (the long string starting with `eyJ`)

3. Click "Add" after each variable

## Step 5: Deploy!
1. Click "Deploy" 
2. Wait 2-3 minutes for build to complete
3. You'll see "🎉 Your project has been deployed!"

## Step 6: Test Your Deployment
1. Click "Visit" to open your live app
2. Your app will be at: `https://team-cost-tracker-xxx.vercel.app`
3. Test the app:
   - Add some players
   - Enter match costs
   - Check if data persists after refresh
   - Look for 🟢 Database Connected in settings

## Troubleshooting
- **Build Failed**: Check the build logs for errors
- **Environment Variables**: Make sure they're correctly set
- **Database Issues**: Verify Supabase credentials in Vercel settings

## After Successful Deployment
Your app is now live! 🎉
- Share the URL with your team
- Database will sync across all devices
- Works offline with automatic sync when back online