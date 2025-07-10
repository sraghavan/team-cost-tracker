# 🗄️ Supabase Database Setup

## Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

## Step 2: Create New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `team-cost-tracker`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

## Step 3: Set Up Database Schema
1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy ALL the content from `database/schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" (▶️ button)
6. You should see "Success" messages for each table created

## Step 4: Get Your Credentials
1. Go to "Settings" (⚙️) in the left sidebar
2. Click "API" 
3. Copy these two values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJ...` (long string starting with eyJ)
4. **SAVE THESE** - you'll need them for Vercel!

## Step 5: Verify Setup
1. Go to "Table Editor" in left sidebar
2. You should see two tables:
   - `players` (empty)
   - `match_history` (empty)
3. If you see these tables, setup is complete! ✅

## What You Need for Next Step:
- ✅ Supabase Project URL
- ✅ Supabase anon key
- ✅ Tables created successfully

Save your credentials safely - you'll need them for Vercel deployment!