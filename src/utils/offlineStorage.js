// Offline storage utilities using IndexedDB
const DB_NAME = 'CostSplitterDB';
const DB_VERSION = 1;
const STORES = {
  PLAYERS: 'players',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'syncQueue'
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Players store
        if (!db.objectStoreNames.contains(STORES.PLAYERS)) {
          const playersStore = db.createObjectStore(STORES.PLAYERS, { keyPath: 'id' });
          playersStore.createIndex('name', 'name', { unique: false });
          playersStore.createIndex('status', 'status', { unique: false });
        }
        
        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Players CRUD operations
  async savePlayers(players) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.PLAYERS], 'readwrite');
    const store = transaction.objectStore(STORES.PLAYERS);
    
    // Clear existing data
    await store.clear();
    
    // Add all players
    for (const player of players) {
      await store.add({
        ...player,
        lastModified: Date.now()
      });
    }
    
    // Queue for sync if online
    if (this.isOnline) {
      await this.queueForSync('UPDATE_PLAYERS', { players });
    }
    
    return transaction.complete;
  }

  async getPlayers() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PLAYERS], 'readonly');
      const store = transaction.objectStore(STORES.PLAYERS);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePlayer(player) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.PLAYERS], 'readwrite');
    const store = transaction.objectStore(STORES.PLAYERS);
    
    const updatedPlayer = {
      ...player,
      lastModified: Date.now()
    };
    
    await store.put(updatedPlayer);
    
    // Queue for sync if online
    if (this.isOnline) {
      await this.queueForSync('UPDATE_PLAYER', { player: updatedPlayer });
    }
    
    return transaction.complete;
  }

  // Settings operations
  async saveSetting(key, value) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    
    await store.put({
      key,
      value,
      timestamp: Date.now()
    });
    
    return transaction.complete;
  }

  async getSetting(key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async queueForSync(type, data) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    await store.add({
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    });
    
    return transaction.complete;
  }

  async getSyncQueue() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    return store.clear();
  }

  async syncOfflineData() {
    if (!this.isOnline) return;
    
    const queue = await this.getSyncQueue();
    console.log(`Syncing ${queue.length} offline changes...`);
    
    for (const item of queue) {
      try {
        // This would integrate with your Supabase sync logic
        await this.processSyncItem(item);
      } catch (error) {
        console.error('Sync failed for item:', item, error);
        // Implement retry logic here
      }
    }
    
    await this.clearSyncQueue();
  }

  async processSyncItem(item) {
    // This method would integrate with your existing Supabase operations
    // For now, just log the sync action
    console.log('Processing sync item:', item.type, item.data);
    
    // Example implementation:
    // switch (item.type) {
    //   case 'UPDATE_PLAYERS':
    //     await supabaseClient.from('players').upsert(item.data.players);
    //     break;
    //   case 'UPDATE_PLAYER':
    //     await supabaseClient.from('players').upsert(item.data.player);
    //     break;
    // }
  }

  // Check if data exists offline
  async hasOfflineData() {
    const players = await this.getPlayers();
    return players.length > 0;
  }

  // Get offline status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      hasOfflineData: this.hasOfflineData()
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Export utility functions
export const isOnline = () => navigator.onLine;
export const enableOfflineMode = () => offlineStorage.init();
export const syncWhenOnline = () => offlineStorage.syncOfflineData();