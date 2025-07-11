import { useState, useEffect, useCallback } from 'react';
import { dbOperations } from '../lib/supabase';

const DEFAULT_PASSWORD = 'cricket2024';
const CACHE_KEY = 'appPassword';

export const usePasswordManager = () => {
  const [currentPassword, setCurrentPassword] = useState(DEFAULT_PASSWORD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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

  // Load password from database or localStorage
  const loadPassword = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from database first if online and configured
      if (isOnline && isSupabaseConfigured()) {
        try {
          const settings = await dbOperations.getAppSettings();
          if (settings && settings.password) {
            setCurrentPassword(settings.password);
            // Update localStorage cache
            localStorage.setItem(CACHE_KEY, settings.password);
            return settings.password;
          }
        } catch (dbError) {
          console.warn('Failed to load password from database:', dbError);
          // Fall back to localStorage
        }
      }
      
      // Fall back to localStorage
      const cachedPassword = localStorage.getItem(CACHE_KEY);
      if (cachedPassword) {
        setCurrentPassword(cachedPassword);
        return cachedPassword;
      }
      
      // Use default password
      setCurrentPassword(DEFAULT_PASSWORD);
      localStorage.setItem(CACHE_KEY, DEFAULT_PASSWORD);
      return DEFAULT_PASSWORD;
      
    } catch (error) {
      console.error('Error loading password:', error);
      setError('Failed to load password');
      // Use default as fallback
      setCurrentPassword(DEFAULT_PASSWORD);
      return DEFAULT_PASSWORD;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, isSupabaseConfigured]);

  // Save password to database and localStorage
  const savePassword = useCallback(async (newPassword) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Always save to localStorage first
      localStorage.setItem(CACHE_KEY, newPassword);
      setCurrentPassword(newPassword);
      
      // Save to database if online and configured
      if (isOnline && isSupabaseConfigured()) {
        try {
          await dbOperations.saveAppSettings({ password: newPassword });
          console.log('Password saved to database');
        } catch (dbError) {
          console.warn('Failed to save password to database:', dbError);
          // Still continue since localStorage save succeeded
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving password:', error);
      setError('Failed to save password');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, isSupabaseConfigured]);

  // Get stored password (for authentication)
  const getStoredPassword = useCallback(() => {
    return currentPassword;
  }, [currentPassword]);

  // Initialize password on mount
  useEffect(() => {
    loadPassword();
  }, [loadPassword]);

  // Sync password when coming back online
  useEffect(() => {
    if (isOnline && isSupabaseConfigured()) {
      loadPassword();
    }
  }, [isOnline, isSupabaseConfigured, loadPassword]);

  return {
    currentPassword,
    isLoading,
    error,
    isOnline,
    savePassword,
    getStoredPassword,
    loadPassword
  };
};