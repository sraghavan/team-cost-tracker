import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations
export const dbOperations = {
  // Players operations
  async getPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async savePlayer(player) {
    const { data, error } = await supabase
      .from('players')
      .upsert({
        id: player.id,
        name: player.name,
        prev_balance: player.prevBalance || 0,
        saturday: player.saturday || 0,
        sunday: player.sunday || 0,
        adv_paid: player.advPaid || 0,
        total: player.total || 0,
        status: player.status || '',
        match_dates: player.matchDates || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async savePlayers(players) {
    const playersData = players.map(player => ({
      id: player.id,
      name: player.name,
      prev_balance: player.prevBalance || 0,
      saturday: player.saturday || 0,
      sunday: player.sunday || 0,
      adv_paid: player.advPaid || 0,
      total: player.total || 0,
      status: player.status || '',
      match_dates: player.matchDates || {},
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('players')
      .upsert(playersData, {
        onConflict: 'id'
      })
      .select();
    
    if (error) throw error;
    return data;
  },

  async deletePlayer(playerId) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);
    
    if (error) throw error;
  },

  // Match history operations
  async getMatchHistory() {
    const { data, error } = await supabase
      .from('match_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data || [];
  },

  async saveMatchHistory(historyEntry) {
    const { data, error } = await supabase
      .from('match_history')
      .insert({
        id: historyEntry.id,
        match_dates: historyEntry.matchDates,
        teams: historyEntry.teams,
        costs: historyEntry.costs,
        players: historyEntry.players,
        total_players: historyEntry.totalPlayers,
        total_amount: historyEntry.totalAmount,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async clearAllData() {
    // Clear players
    const { error: playersError } = await supabase
      .from('players')
      .delete()
      .neq('id', '');
    
    if (playersError) throw playersError;

    // Clear match history
    const { error: historyError } = await supabase
      .from('match_history')
      .delete()
      .neq('id', '');
    
    if (historyError) throw historyError;
  },

  // App settings operations
  async getAppSettings() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async saveAppSettings(settings) {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        id: 'main',
        password: settings.password,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();
    
    if (error) throw error;
    return data[0];
  }
};