import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for service worker messages
    const handleMessage = (event) => {
      if (event.data.type === 'APP_UPDATE_AVAILABLE') {
        setUpdateInfo({
          oldVersion: event.data.oldVersion,
          newVersion: event.data.newVersion,
          timestamp: event.data.timestamp
        });
        setUpdateAvailable(true);
        setDismissed(false);
      } else if (event.data.type === 'RELOAD_APP') {
        // Force reload the app
        window.location.reload();
      }
    };

    // Register message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    // Check for pending updates on component mount
    checkForPendingUpdate();

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const checkForPendingUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        // There's an update waiting
        setUpdateAvailable(true);
        setUpdateInfo({
          oldVersion: 'Current',
          newVersion: 'New',
          timestamp: Date.now()
        });
      }
    }
  };

  const handleUpdateNow = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          // Tell the waiting SW to skip waiting and become active
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    
    // Reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setDismissed(true);
    
    // Store dismissal with timestamp
    localStorage.setItem('updateDismissed', JSON.stringify({
      timestamp: Date.now(),
      version: updateInfo?.newVersion
    }));
  };

  const handleRemindLater = () => {
    setDismissed(true);
    
    // Set reminder for 2 hours
    setTimeout(() => {
      setDismissed(false);
    }, 2 * 60 * 60 * 1000);
  };

  // Don't show if dismissed or no update available
  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="update-notification">
      <div className="update-content">
        <div className="update-icon">🚀</div>
        <div className="update-text">
          <h4>New Update Available!</h4>
          <p>
            {updateInfo ? (
              <>Version {updateInfo.newVersion} is ready with new features and improvements.</>
            ) : (
              <>A new version of Team Cost Tracker is available with improvements.</>
            )}
          </p>
        </div>
        <div className="update-actions">
          <button 
            className="update-btn primary"
            onClick={handleUpdateNow}
          >
            🔄 Update Now
          </button>
          <button 
            className="update-btn secondary"
            onClick={handleRemindLater}
          >
            ⏰ Later
          </button>
          <button 
            className="update-btn dismiss"
            onClick={handleDismiss}
            title="Dismiss until next update"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;