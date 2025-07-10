# 🚀 Deployment Guide

This guide will help you deploy the Team Cost Tracker to the cloud with a free database and hosting.

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database/schema.sql`
3. Paste and run the SQL script
4. This creates the `players` and `match_history` tables

### 3. Get Database Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like `https://xyz.supabase.co`)
3. Copy your **anon/public** key
4. Keep these safe - you'll need them for deployment

## 🌐 Hosting Setup (Vercel)

### 1. Push to GitHub
```bash
# If you haven't already pushed to GitHub:
gh repo create team-cost-tracker --public
git remote add origin https://github.com/YOUR_USERNAME/team-cost-tracker.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click **"New Project"**
4. Import your `team-cost-tracker` repository
5. Configure the deployment:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3. Add Environment Variables
In Vercel project settings, add these environment variables:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Deploy
Click **"Deploy"** - Vercel will build and deploy your app!

## 🔄 Offline-First Architecture

The app works in three modes:

### 1. **Full Online Mode** 
- Database connected ✅
- Real-time sync ✅
- Multi-device sync ✅

### 2. **Offline Mode**
- Works without internet ✅
- LocalStorage backup ✅
- Syncs when back online ✅

### 3. **LocalStorage Only**
- No database configured ✅
- Full functionality ✅
- Manual export/import ✅

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | Optional* |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key | Optional* |

*If not provided, app runs in localStorage-only mode

### Local Development
1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials
3. Run `npm start`

## 📱 Features by Mode

| Feature | Online + DB | Offline | LocalStorage Only |
|---------|-------------|---------|-------------------|
| Cost Splitting | ✅ | ✅ | ✅ |
| Player Management | ✅ | ✅ | ✅ |
| Match History | ✅ | ✅ | ✅ |
| Auto-save | ✅ | ✅ | ✅ |
| Multi-device Sync | ✅ | ❌ | ❌ |
| WhatsApp Export | ✅ | ✅ | ✅ |
| Excel Export | ✅ | ✅ | ✅ |

## 🚨 Troubleshooting

### Database Connection Issues
- Check environment variables are correct
- Verify Supabase project is active
- Check browser console for errors

### Deployment Issues
- Ensure all files are committed to Git
- Check Vercel build logs
- Verify environment variables in Vercel dashboard

### Data Sync Issues
- Check network connection
- Look for sync pending indicator
- Use "Clear All Data" to reset if needed

## 🔒 Security Notes

- The current setup uses Row Level Security (RLS) with open policies
- For production use, consider adding user authentication
- Supabase provides built-in auth if needed

## 💡 Cost Information

**Supabase Free Tier:**
- 2GB database storage
- 50MB file storage
- 500MB bandwidth per month
- Perfect for team cost tracking!

**Vercel Free Tier:**
- 100GB bandwidth per month
- Unlimited deployments
- Custom domains
- Great for this app!

## 🎯 Next Steps

After deployment:
1. Test the app with your team
2. Set up team access (share the URL)
3. Consider adding authentication for multiple teams
4. Monitor usage in Supabase/Vercel dashboards

Your app will be available at: `https://your-project.vercel.app`