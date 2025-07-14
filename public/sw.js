const CACHE_NAME = 'cost-splitter-v16'; // Increment this for each deployment
const APP_VERSION = '1.0.14'; // Semantic versioning
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources and detect updates
self.addEventListener('install', event => {
  console.log(`Installing Service Worker version ${APP_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Cache resources
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache);
        })
        .catch(err => {
          console.log('Cache failed:', err);
        }),
      
      // Check for version update
      checkForAppUpdate()
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle offline data sync
function doBackgroundSync() {
  return new Promise((resolve, reject) => {
    // Get offline data from IndexedDB and sync with Supabase
    // This will be implemented when we add offline storage
    console.log('Background sync triggered');
    resolve();
  });
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    scheduleReminder(event.data.settings);
  }
});

// Push notification event handler
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'payment-reminder',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'share',
          title: 'Share to WhatsApp'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'share') {
    // Open WhatsApp with reminder message
    const data = event.notification.data;
    if (data && data.whatsappMessage) {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(data.whatsappMessage)}`;
      event.waitUntil(
        clients.openWindow(whatsappUrl)
      );
    }
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Schedule reminder notifications
function scheduleReminder(settings) {
  if (!settings.enabled) return;
  
  // Clear existing alarms
  clearReminders();
  
  // Calculate next reminder time
  const now = new Date();
  const [hours, minutes] = settings.time.split(':').map(Number);
  const nextReminder = new Date(now);
  nextReminder.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1);
  }
  
  // Calculate interval based on frequency
  let intervalDays = 1;
  switch (settings.frequency) {
    case 'daily':
      intervalDays = 1;
      break;
    case 'weekly':
      intervalDays = 7;
      break;
    case 'custom':
      intervalDays = settings.customDays || 7;
      break;
  }
  
  // Store reminder settings
  const reminderData = {
    nextReminder: nextReminder.getTime(),
    intervalDays,
    settings
  };
  
  // Use IndexedDB to store reminder schedule
  storeReminderSchedule(reminderData);
  
  // Set up periodic check
  setInterval(() => {
    checkAndSendReminders();
  }, 60000); // Check every minute
}

// Store reminder schedule in IndexedDB
function storeReminderSchedule(data) {
  const request = indexedDB.open('CostSplitterDB', 1);
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    store.put({
      key: 'reminderSchedule',
      value: data,
      timestamp: Date.now()
    });
  };
}

// Check and send reminders
function checkAndSendReminders() {
  const request = indexedDB.open('CostSplitterDB', 1);
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['settings', 'players'], 'readonly');
    const settingsStore = transaction.objectStore('settings');
    const playersStore = transaction.objectStore('players');
    
    settingsStore.get('reminderSchedule').onsuccess = (event) => {
      const scheduleData = event.target.result;
      if (!scheduleData) return;
      
      const { nextReminder, intervalDays, settings } = scheduleData.value;
      const now = Date.now();
      
      if (now >= nextReminder) {
        // Get players data
        playersStore.getAll().onsuccess = (event) => {
          const players = event.target.result;
          sendReminderNotification(players, settings);
          
          // Schedule next reminder
          const newNextReminder = nextReminder + (intervalDays * 24 * 60 * 60 * 1000);
          storeReminderSchedule({
            nextReminder: newNextReminder,
            intervalDays,
            settings
          });
        };
      }
    };
  };
}

// Send reminder notification
function sendReminderNotification(players, settings) {
  const pendingPlayers = players.filter(player => {
    const isPending = player.status === 'Pending';
    const isPartial = player.status === 'Partially Paid';
    const hasPlayed = (player.saturday || 0) > 0 || (player.sunday || 0) > 0;
    
    return hasPlayed && (
      (settings.includePending && isPending) ||
      (settings.includePartial && isPartial)
    );
  });
  
  if (pendingPlayers.length === 0) return;
  
  const whatsappMessage = `⏰ *Payment Reminder*\n${new Date().toLocaleDateString()}\n\n` +
    pendingPlayers.map(player => 
      `${player.name}: ₹${player.total || 0} (${player.status || 'Pending'})`
    ).join('\n') +
    '\n\n_Team Cost Tracker_';
  
  const notificationData = {
    title: 'Payment Reminder',
    body: `${pendingPlayers.length} players have pending payments`,
    data: {
      whatsappMessage,
      pendingCount: pendingPlayers.length
    }
  };
  
  self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    tag: 'payment-reminder',
    data: notificationData.data,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'share',
        title: 'Share to WhatsApp'
      }
    ]
  });
}

// Clear existing reminders
function clearReminders() {
  // Clear from IndexedDB
  const request = indexedDB.open('CostSplitterDB', 1);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    store.delete('reminderSchedule');
  };
}

// Check for app updates and notify
async function checkForAppUpdate() {
  try {
    // Get stored version
    const storedVersion = await getStoredVersion();
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(`App updated from ${storedVersion} to ${APP_VERSION}`);
      
      // Send update notification
      await sendUpdateNotification(storedVersion, APP_VERSION);
      
      // Notify main thread about update
      broadcastUpdateMessage(storedVersion, APP_VERSION);
    }
    
    // Store current version
    await storeCurrentVersion();
    
  } catch (error) {
    console.error('Error checking for app update:', error);
  }
}

// Get stored app version
function getStoredVersion() {
  return new Promise((resolve) => {
    const request = indexedDB.open('CostSplitterDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const getRequest = store.get('appVersion');
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result ? result.value : null);
      };
      getRequest.onerror = () => resolve(null);
    };
    
    request.onerror = () => resolve(null);
  });
}

// Store current app version
function storeCurrentVersion() {
  return new Promise((resolve) => {
    const request = indexedDB.open('CostSplitterDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      store.put({
        key: 'appVersion',
        value: APP_VERSION,
        timestamp: Date.now()
      });
      
      resolve();
    };
    
    request.onerror = () => resolve();
  });
}

// Send push notification for app update
async function sendUpdateNotification(oldVersion, newVersion) {
  try {
    const notificationOptions = {
      title: '🚀 Team Cost Tracker Updated!',
      body: `New version ${newVersion} is available with improvements and bug fixes.`,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: '🔄 Reload App'
        },
        {
          action: 'dismiss',
          title: '⏰ Later'
        }
      ],
      data: {
        type: 'app-update',
        oldVersion,
        newVersion,
        updateTime: new Date().toISOString()
      }
    };
    
    await self.registration.showNotification(
      notificationOptions.title,
      notificationOptions
    );
    
  } catch (error) {
    console.error('Failed to send update notification:', error);
  }
}

// Broadcast update message to all clients
function broadcastUpdateMessage(oldVersion, newVersion) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'APP_UPDATE_AVAILABLE',
        oldVersion,
        newVersion,
        timestamp: Date.now()
      });
    });
  });
}

// Handle update notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.tag === 'app-update') {
    if (event.action === 'update') {
      // Reload all clients
      event.waitUntil(
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'RELOAD_APP'
            });
          });
        })
      );
    } else if (event.action === 'dismiss') {
      // Schedule reminder for later
      setTimeout(() => {
        sendUpdateReminder();
      }, 2 * 60 * 60 * 1000); // Remind after 2 hours
    } else {
      // Default action - open app
      event.waitUntil(
        clients.openWindow('/')
      );
    }
    return;
  }
  
  // Handle other notification clicks (existing code)
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'share') {
    const data = event.notification.data;
    if (data && data.whatsappMessage) {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(data.whatsappMessage)}`;
      event.waitUntil(
        clients.openWindow(whatsappUrl)
      );
    }
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Send update reminder
async function sendUpdateReminder() {
  try {
    await self.registration.showNotification(
      '⏰ App Update Reminder',
      {
        body: 'Don\'t forget to update your Team Cost Tracker for the latest features!',
        icon: '/icon-192x192.svg',
        tag: 'app-update-reminder',
        actions: [
          {
            action: 'update',
            title: '🔄 Update Now'
          }
        ]
      }
    );
  } catch (error) {
    console.error('Failed to send update reminder:', error);
  }
}