import React, { useState, useEffect } from 'react';
import './SettingsTab.css';

const SettingsTab = ({ players, onReminderSettingsChange }) => {
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: false,
    frequency: 'weekly', // daily, weekly, custom
    customDays: 7,
    time: '10:00',
    onlyWeekdays: false,
    includePending: true,
    includePartial: true
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('reminderSettings');
    if (savedSettings) {
      setReminderSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (newSettings) => {
    setReminderSettings(newSettings);
    localStorage.setItem('reminderSettings', JSON.stringify(newSettings));
    onReminderSettingsChange?.(newSettings);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Test notification
        new Notification('Team Cost Tracker', {
          body: 'Notifications enabled! You\'ll receive payment reminders.',
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg'
        });
      }
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...reminderSettings, [key]: value };
    saveSettings(newSettings);
  };

  const generateReminderImage = () => {
    const pendingPlayers = players.filter(player => {
      const isPending = player.status === 'Pending';
      const isPartial = player.status === 'Partially Paid';
      const hasPlayed = (player.saturday || 0) > 0 || (player.sunday || 0) > 0;
      
      return hasPlayed && (
        (reminderSettings.includePending && isPending) ||
        (reminderSettings.includePartial && isPartial)
      );
    });

    if (pendingPlayers.length === 0) {
      alert('No pending payments found!');
      return;
    }

    // Create canvas for reminder image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 120 + (pendingPlayers.length * 40);
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(0, 0, canvas.width, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⏰ Payment Reminder', canvas.width / 2, 35);
    
    // Date
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, 85);
    
    // Pending players
    let yPos = 110;
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    pendingPlayers.forEach(player => {
      const amount = player.total || 0;
      const status = player.status || 'Pending';
      
      ctx.fillStyle = status === 'Pending' ? '#dc3545' : '#fd7e14';
      ctx.fillText(`${player.name}: ₹${amount} (${status})`, 20, yPos);
      yPos += 30;
    });
    
    // Footer
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Team Cost Tracker - Payment Reminder', canvas.width / 2, canvas.height - 10);
    
    // Convert to blob and copy to clipboard
    canvas.toBlob(async (blob) => {
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        alert('Reminder image copied to clipboard! You can now paste it anywhere.');
      } catch (err) {
        console.error('Failed to copy image:', err);
        // Fallback: download the image
        const link = document.createElement('a');
        link.download = `payment-reminder-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    });
  };

  const shareToWhatsApp = () => {
    const pendingPlayers = players.filter(player => {
      const isPending = player.status === 'Pending';
      const isPartial = player.status === 'Partially Paid';
      const hasPlayed = (player.saturday || 0) > 0 || (player.sunday || 0) > 0;
      
      return hasPlayed && (
        (reminderSettings.includePending && isPending) ||
        (reminderSettings.includePartial && isPartial)
      );
    });

    if (pendingPlayers.length === 0) {
      alert('No pending payments found!');
      return;
    }

    const message = `⏰ *Payment Reminder*\n${new Date().toLocaleDateString()}\n\n` +
      pendingPlayers.map(player => 
        `${player.name}: ₹${player.total || 0} (${player.status || 'Pending'})`
      ).join('\n') +
      '\n\n_Team Cost Tracker_';

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const testReminder = () => {
    if (notificationPermission === 'granted') {
      const pendingCount = players.filter(player => {
        const isPending = player.status === 'Pending';
        const isPartial = player.status === 'Partially Paid';
        const hasPlayed = (player.saturday || 0) > 0 || (player.sunday || 0) > 0;
        
        return hasPlayed && (
          (reminderSettings.includePending && isPending) ||
          (reminderSettings.includePartial && isPartial)
        );
      }).length;

      new Notification('Payment Reminder', {
        body: `${pendingCount} players have pending payments`,
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: 'payment-reminder'
      });
    }
  };

  return (
    <div className="settings-tab">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Configure payment reminders and notifications</p>
      </div>

      <div className="settings-section">
        <h3>🔔 Push Notifications</h3>
        <div className="setting-item">
          <div className="setting-info">
            <label>Enable Notifications</label>
            <p>Allow browser notifications for payment reminders</p>
          </div>
          <div className="setting-control">
            {notificationPermission === 'default' && (
              <button 
                className="permission-btn"
                onClick={requestNotificationPermission}
              >
                Enable Notifications
              </button>
            )}
            {notificationPermission === 'granted' && (
              <div className="permission-granted">
                <span>✅ Enabled</span>
                <button onClick={testReminder} className="test-btn">
                  Test
                </button>
              </div>
            )}
            {notificationPermission === 'denied' && (
              <span className="permission-denied">❌ Denied (Enable in browser settings)</span>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>⏰ Reminder Settings</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Enable Reminders</label>
            <p>Automatically send payment reminders</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={reminderSettings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Reminder Frequency</label>
            <p>How often to send reminders</p>
          </div>
          <div className="setting-control">
            <select 
              value={reminderSettings.frequency}
              onChange={(e) => handleSettingChange('frequency', e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {reminderSettings.frequency === 'custom' && (
          <div className="setting-item">
            <div className="setting-info">
              <label>Custom Days</label>
              <p>Send reminder every X days</p>
            </div>
            <div className="setting-control">
              <input
                type="number"
                min="1"
                max="30"
                value={reminderSettings.customDays}
                onChange={(e) => handleSettingChange('customDays', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <label>Reminder Time</label>
            <p>What time to send reminders</p>
          </div>
          <div className="setting-control">
            <input
              type="time"
              value={reminderSettings.time}
              onChange={(e) => handleSettingChange('time', e.target.value)}
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Include Pending Payments</label>
            <p>Show players with pending status</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={reminderSettings.includePending}
                onChange={(e) => handleSettingChange('includePending', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Include Partial Payments</label>
            <p>Show players with partially paid status</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={reminderSettings.includePartial}
                onChange={(e) => handleSettingChange('includePartial', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>📱 Quick Actions</h3>
        <div className="quick-actions">
          <button 
            className="action-btn generate-btn"
            onClick={generateReminderImage}
          >
            📸 Generate Reminder Image
          </button>
          <button 
            className="action-btn whatsapp-btn"
            onClick={shareToWhatsApp}
          >
            📱 Share to WhatsApp
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>ℹ️ App Information</h3>
        <div className="app-info">
          <div className="info-item">
            <span className="info-label">App Version</span>
            <span className="info-value">1.0.3</span>
          </div>
          <div className="info-item">
            <span className="info-label">Update Notifications</span>
            <span className="info-value">
              {notificationPermission === 'granted' ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">PWA Status</span>
            <span className="info-value">
              {window.matchMedia('(display-mode: standalone)').matches ? '📱 Installed' : '🌐 Browser'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Update Check</span>
            <span className="info-value">{new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div className="update-info">
          <p>🚀 <strong>Auto-Update:</strong> You'll receive push notifications when new versions are deployed!</p>
          <p>📱 <strong>PWA Mode:</strong> Install this app for the best experience and automatic updates.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;