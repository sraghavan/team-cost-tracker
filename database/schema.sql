-- Team Cost Tracker Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    prev_balance DECIMAL(10,2) DEFAULT 0,
    saturday DECIMAL(10,2) DEFAULT 0,
    sunday DECIMAL(10,2) DEFAULT 0,
    adv_paid DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT '',
    match_dates JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match history table
CREATE TABLE IF NOT EXISTS match_history (
    id TEXT PRIMARY KEY,
    match_dates JSONB NOT NULL,
    teams JSONB NOT NULL,
    costs JSONB NOT NULL,
    players JSONB NOT NULL,
    total_players INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players(updated_at);
CREATE INDEX IF NOT EXISTS idx_match_history_created_at ON match_history(created_at);

-- Row Level Security (RLS) - Enable for basic security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these based on your needs)
-- For now, allow all operations (you might want to restrict this in production)
CREATE POLICY "Allow all operations on players" ON players
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on match_history" ON match_history
    FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on players table
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default players (optional - you can skip this if you prefer empty start)
-- Uncomment the lines below if you want to pre-populate with default players

/*
INSERT INTO players (id, name, prev_balance, saturday, sunday, adv_paid, total, status, match_dates) VALUES
('default_0_' || extract(epoch from now()), 'Harjinder', 0, 0, 0, 0, 0, '', '{}'),
('default_1_' || extract(epoch from now()), 'Vijay Lal', 0, 0, 0, 0, 0, '', '{}'),
('default_2_' || extract(epoch from now()), 'Kamal Karwal', 0, 0, 0, 0, 0, '', '{}'),
('default_3_' || extract(epoch from now()), 'Parag', 0, 0, 0, 0, 0, '', '{}'),
('default_4_' || extract(epoch from now()), 'Anjeev', 0, 0, 0, 0, 0, '', '{}'),
('default_5_' || extract(epoch from now()), 'Vedji', 0, 0, 0, 0, 0, '', '{}'),
('default_6_' || extract(epoch from now()), 'Shyam', 0, 0, 0, 0, 0, '', '{}'),
('default_7_' || extract(epoch from now()), 'Sagar', 0, 0, 0, 0, 0, '', '{}'),
('default_8_' || extract(epoch from now()), 'Nitin Verma', 0, 0, 0, 0, 0, '', '{}'),
('default_9_' || extract(epoch from now()), 'Sudhir', 0, 0, 0, 0, 0, '', '{}'),
('default_10_' || extract(epoch from now()), 'Baram (Gullu)', 0, 0, 0, 0, 0, '', '{}'),
('default_11_' || extract(epoch from now()), 'Balle', 0, 0, 0, 0, 0, '', '{}'),
('default_12_' || extract(epoch from now()), 'Nikhil', 0, 0, 0, 0, 0, '', '{}'),
('default_13_' || extract(epoch from now()), 'Sailesh', 0, 0, 0, 0, 0, '', '{}'),
('default_14_' || extract(epoch from now()), 'Gyan', 0, 0, 0, 0, 0, '', '{}'),
('default_15_' || extract(epoch from now()), 'Avinash', 0, 0, 0, 0, 0, '', '{}'),
('default_16_' || extract(epoch from now()), 'PK', 0, 0, 0, 0, 0, '', '{}'),
('default_17_' || extract(epoch from now()), 'Ashish Sikka', 0, 0, 0, 0, 0, '', '{}'),
('default_18_' || extract(epoch from now()), 'Dr. Mangal', 0, 0, 0, 0, 0, '', '{}'),
('default_19_' || extract(epoch from now()), 'Deepak', 0, 0, 0, 0, 0, '', '{}'),
('default_20_' || extract(epoch from now()), 'Bhanu', 0, 0, 0, 0, 0, '', '{}'),
('default_21_' || extract(epoch from now()), 'Henam', 0, 0, 0, 0, 0, '', '{}'),
('default_22_' || extract(epoch from now()), 'Shantanu', 0, 0, 0, 0, 0, '', '{}'),
('default_23_' || extract(epoch from now()), 'Pratap', 0, 0, 0, 0, 0, '', '{}'),
('default_24_' || extract(epoch from now()), 'Nitin', 0, 0, 0, 0, 0, '', '{}'),
('default_25_' || extract(epoch from now()), 'Aryan', 0, 0, 0, 0, 0, '', '{}'),
('default_26_' || extract(epoch from now()), 'Amit Tyagi', 0, 0, 0, 0, 0, '', '{}'),
('default_27_' || extract(epoch from now()), 'Sunil Anna', 0, 0, 0, 0, 0, '', '{}'),
('default_28_' || extract(epoch from now()), 'Vignesh', 0, 0, 0, 0, 0, '', '{}'),
('default_29_' || extract(epoch from now()), 'Chandeep', 0, 0, 0, 0, 0, '', '{}')
ON CONFLICT (id) DO NOTHING;
*/