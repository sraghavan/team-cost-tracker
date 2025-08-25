import { useState, useEffect, useCallback } from 'react';
import { dbOperations } from '../lib/supabase';
import { initializePlayersIfEmpty } from '../utils/defaultPlayers';

const CACHE_KEY = 'teamCostData';
const BACKUP_KEY = 'teamCostDataBackup';
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds
const BACKUP_INTERVAL = 300000; // 5 minutes

export const useDatabase = (initialData = []) => {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      let loadedData = cached ? JSON.parse(cached) : initializePlayersIfEmpty(initialData);
      
      // Remove duplicate players by name, keeping the first occurrence
      const seen = new Set();
      loadedData = loadedData.filter(player => {
        if (seen.has(player.name)) {
          console.warn(`Removing duplicate player: ${player.name}`);
          return false;
        }
        seen.add(player.name);
        return true;
      });
      
      return loadedData;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return initializePlayersIfEmpty(initialData);
    }
  });

  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(false);

  // Check if Supabase is configured
  const isSupabaseConfigured = useCallback(() => {
    return !!(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncPending) {
        syncToDatabase();
      }
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPending]);

  // Load data from database on app start
  useEffect(() => {
    if (isSupabaseConfigured() && isOnline) {
      loadFromDatabase();
    }
  }, []);

  const loadFromDatabase = async () => {
    try {
      setSaveStatus('loading');
      const players = await dbOperations.getPlayers();
      if (players.length > 0) {
        let formattedPlayers = players.map(p => ({
          id: p.id,
          name: p.name,
          prevBalance: p.prev_balance || 0,
          saturday: p.saturday || 0,
          sunday: p.sunday || 0,
          advPaid: p.adv_paid || 0,
          total: p.total || 0,
          status: p.status || '',
          matchDates: p.match_dates || {}
        }));
        
        // Remove duplicate players by name, keeping the first occurrence
        const seen = new Set();
        formattedPlayers = formattedPlayers.filter(player => {
          if (seen.has(player.name)) {
            console.warn(`Removing duplicate player from database: ${player.name}`);
            return false;
          }
          seen.add(player.name);
          return true;
        });
        
        setData(formattedPlayers);
        localStorage.setItem(CACHE_KEY, JSON.stringify(formattedPlayers));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error loading from database:', error);
      setSaveStatus('error');
      // Continue with localStorage data
    }
  };

  const syncToDatabase = async () => {
    if (!isSupabaseConfigured() || !isOnline) {
      setSyncPending(true);
      return;
    }

    try {
      setSaveStatus('saving');
      await dbOperations.savePlayers(data);
      setSyncPending(false);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error syncing to database:', error);
      setSaveStatus('error');
      setSyncPending(true);
    }
  };

  // Auto-save to localStorage and sync to database
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      try {
        // Always save to localStorage first
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        
        // Sync to database if available
        if (isSupabaseConfigured() && isOnline) {
          await syncToDatabase();
        } else {
          setSaveStatus('saved');
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error saving data:', error);
        setSaveStatus('error');
      }
    }, AUTO_SAVE_INTERVAL);

    setSaveStatus('saving');
    return () => clearTimeout(saveTimer);
  }, [data, isOnline]);

  // Auto-backup every 5 minutes
  useEffect(() => {
    const backupTimer = setInterval(() => {
      try {
        const backupData = {
          data,
          timestamp: new Date().toISOString(),
          version: '2.0'
        };
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
      } catch (error) {
        console.error('Error creating backup:', error);
      }
    }, BACKUP_INTERVAL);

    return () => clearInterval(backupTimer);
  }, [data]);

  const updateData = useCallback((newData) => {
    // Remove duplicate players by name before saving
    const seen = new Set();
    const dedupedData = newData.filter(player => {
      if (seen.has(player.name)) {
        console.warn(`Preventing duplicate player: ${player.name}`);
        return false;
      }
      seen.add(player.name);
      return true;
    });
    setData(dedupedData);
  }, []);

  const clearCache = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem('matchHistory');
    
    // Clear database if available
    if (isSupabaseConfigured() && isOnline) {
      try {
        await dbOperations.clearAllData();
      } catch (error) {
        console.error('Error clearing database:', error);
      }
    }
    
    setData(initializePlayersIfEmpty(initialData));
    setSaveStatus('saved');
  }, [initialData, isOnline]);

  const restoreFromBackup = useCallback(() => {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const backupData = JSON.parse(backup);
        setData(backupData.data);
        return backupData.timestamp;
      }
      return null;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return null;
    }
  }, []);

  const getCacheInfo = useCallback(() => {
    const cacheSize = localStorage.getItem(CACHE_KEY)?.length || 0;
    const backupInfo = localStorage.getItem(BACKUP_KEY);
    let backupTimestamp = null;
    
    if (backupInfo) {
      try {
        backupTimestamp = JSON.parse(backupInfo).timestamp;
      } catch (e) {
        // ignore
      }
    }

    return {
      cacheSize,
      backupTimestamp,
      isOnline,
      syncPending,
      usingDatabase: isSupabaseConfigured()
    };
  }, [isOnline, syncPending]);

  return {
    data,
    updateData,
    saveStatus: syncPending ? 'sync-pending' : saveStatus,
    lastSaved,
    clearCache,
    restoreFromBackup,
    getCacheInfo,
    isOnline,
    syncPending,
    loadFromDatabase,
    syncToDatabase
  };
};