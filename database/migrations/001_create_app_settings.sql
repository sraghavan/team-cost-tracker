-- Create app_settings table for storing application configuration
-- This table stores the app password and other future settings

CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default password if table is empty
INSERT INTO app_settings (id, password) 
VALUES ('main', 'cricket2024')
ON CONFLICT (id) DO NOTHING;

-- Create an index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at ON app_settings(updated_at);

-- Add RLS (Row Level Security) policies if using Supabase
-- Note: You may need to adjust these based on your security requirements
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access (adjust as needed for your security model)
CREATE POLICY "Allow read access to app_settings" ON app_settings
    FOR SELECT USING (true);

-- Allow update access (adjust as needed for your security model)
CREATE POLICY "Allow update access to app_settings" ON app_settings
    FOR UPDATE USING (true);

-- Allow insert access (adjust as needed for your security model)
CREATE POLICY "Allow insert access to app_settings" ON app_settings
    FOR INSERT WITH CHECK (true);