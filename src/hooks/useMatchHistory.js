import { useState, useEffect, useCallback } from 'react';
import { dbOperations } from '../lib/supabase';

const MATCH_HISTORY_KEY = 'matchHistory';

export const useMatchHistory = () => {
  const [matchHistory, setMatchHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(MATCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check if Supabase is configured
  const isSupabaseConfigured = useCallback(() => {
    return !!(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load match history from database on app start
  useEffect(() => {
    if (isSupabaseConfigured() && isOnline) {
      loadFromDatabase();
    }
  }, []);

  const loadFromDatabase = async () => {
    try {
      const history = await dbOperations.getMatchHistory();
      if (history.length > 0) {
        const formattedHistory = history.map(h => ({
          id: h.id,
          date: h.created_at,
          matchDates: h.match_dates,
          teams: h.teams,
          costs: h.costs,
          players: h.players,
          totalPlayers: h.total_players,
          totalAmount: h.total_amount
        }));
        setMatchHistory(formattedHistory);
        localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(formattedHistory));
      }
    } catch (error) {
      console.error('Error loading match history from database:', error);
    }
  };

  const saveMatchHistory = useCallback(async (historyEntry) => {
    const updatedHistory = [historyEntry, ...matchHistory].slice(0, 20);
    setMatchHistory(updatedHistory);
    localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(updatedHistory));

    // Sync to database if available
    if (isSupabaseConfigured() && isOnline) {
      try {
        await dbOperations.saveMatchHistory(historyEntry);
      } catch (error) {
        console.error('Error saving match history to database:', error);
      }
    }
  }, [matchHistory, isOnline]);

  const clearMatchHistory = useCallback(async () => {
    setMatchHistory([]);
    localStorage.removeItem(MATCH_HISTORY_KEY);

    // Clear from database if available
    if (isSupabaseConfigured() && isOnline) {
      try {
        // Note: This will be handled by the main clearAllData function
      } catch (error) {
        console.error('Error clearing match history from database:', error);
      }
    }
  }, [isOnline]);

  return {
    matchHistory,
    saveMatchHistory,
    clearMatchHistory,
    loadFromDatabase
  };
};