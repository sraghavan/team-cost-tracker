# Database Setup for Team Cost Tracker

This application uses Supabase as the database backend. The following tables are required:

## Required Tables

### 1. `players` table
Stores player information and match costs.

### 2. `match_history` table  
Stores historical match data for undo functionality.

### 3. `app_settings` table
Stores application configuration including the password.

## Setting up the Database

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration script: `migrations/001_create_app_settings.sql`

### Option 2: Using Supabase CLI
```bash
supabase db reset --linked
supabase db push
```

## Environment Variables

Make sure your `.env` file contains:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Data Sync Behavior

The application uses a hybrid approach:

1. **Online Mode**: Data is saved to both localStorage and Supabase
2. **Offline Mode**: Data is saved to localStorage only
3. **Sync**: When coming back online, data is automatically synced

## Password Storage

- **Database**: Encrypted and stored in the `app_settings` table
- **Local Cache**: Cached in localStorage for offline access
- **Default**: `cricket2024` (can be changed via admin panel)

## Security Notes

- The app uses Row Level Security (RLS) policies
- Password is stored in plain text (consider hashing in production)
- Admin panel accessible via `/admin` URL only
- Session-based authentication (expires on browser close)