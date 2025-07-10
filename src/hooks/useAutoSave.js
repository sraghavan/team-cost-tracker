import { useState, useEffect, useCallback } from 'react';
import { initializePlayersIfEmpty } from '../utils/defaultPlayers';

const CACHE_KEY = 'teamCostTracker_cache';
const BACKUP_KEY = 'teamCostTracker_backup';
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds
const BACKUP_INTERVAL = 300000; // 5 minutes

export const useAutoSave = (initialData = []) => {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const loadedData = cached ? JSON.parse(cached) : initialData;
      return initializePlayersIfEmpty(loadedData);
    } catch (error) {
      console.error('Error loading cache:', error);
      return initializePlayersIfEmpty(initialData);
    }
  });

  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(new Date());

  // Auto-save to cache
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving to cache:', error);
        setSaveStatus('error');
      }
    }, AUTO_SAVE_INTERVAL);

    setSaveStatus('saving');
    return () => clearTimeout(saveTimer);
  }, [data]);

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
    setData(newData);
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem('matchHistory'); // Clear match history too
    setData(initializePlayersIfEmpty(initialData));
    setSaveStatus('saved');
  }, [initialData]);

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
      lastSaved,
      saveStatus
    };
  }, [lastSaved, saveStatus]);

  return {
    data,
    updateData,
    saveStatus,
    lastSaved,
    clearCache,
    restoreFromBackup,
    getCacheInfo
  };
};