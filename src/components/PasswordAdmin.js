import React, { useState, useEffect } from 'react';
import './PasswordAdmin.css';

const PasswordAdmin = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Load current password
    const stored = localStorage.getItem('appPassword') || 'cricket2024';
    setCurrentPassword(stored);
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(currentPassword);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      showMessage('Please enter a new password', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showMessage('Password must be at least 4 characters long', 'error');
      return;
    }

    setIsLoading(true);

    // Simulate slight delay for better UX
    setTimeout(() => {
      try {
        // Update password in localStorage
        localStorage.setItem('appPassword', newPassword);
        setCurrentPassword(newPassword);
        
        // Clear form
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear any existing authentication to force re-login
        sessionStorage.removeItem('appAuthenticated');
        sessionStorage.removeItem('authTime');
        
        showMessage('Password updated successfully! Users will need to re-authenticate.', 'success');
        
      } catch (error) {
        showMessage('Failed to update password. Please try again.', 'error');
      }
      
      setIsLoading(false);
    }, 500);
  };

  const handleReset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
    setMessageType('');
  };

  const goBack = () => {
    // Use history API for SPA navigation
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="password-admin">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-logo">🔐</div>
          <h1>Password Administration</h1>
          <p>Manage the app access password</p>
        </div>

        <div className="admin-content">
          {/* Current Password Display */}
          <div className="current-password-section">
            <h3>Current Password</h3>
            <div className="password-display">
              <div className="password-box">
                <div className="password-row">
                  <span className="password-value">{currentPassword}</span>
                  <button 
                    className="copy-button"
                    onClick={handleCopyPassword}
                    title="Copy password"
                  >
                    {copySuccess ? '✅' : '📋'}
                  </button>
                </div>
                <span className="password-label">Active Password</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="change-password-section">
            <h3>Change Password</h3>
            
            {message && (
              <div className={`admin-message ${messageType}`}>
                {messageType === 'success' ? '✅' : '❌'} {message}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="admin-form">
              <div className="input-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="text"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="admin-button secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </button>
                
                <button 
                  type="submit" 
                  className="admin-button primary"
                  disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Info */}
          <div className="security-info">
            <h3>Security Notes</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-icon">🔒</span>
                <div className="info-text">
                  <strong>Password Storage</strong>
                  <p>Passwords are stored locally in browser storage</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">⏰</span>
                <div className="info-text">
                  <strong>Session Management</strong>
                  <p>Authentication expires when browser closes</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🔄</span>
                <div className="info-text">
                  <strong>Auto Logout</strong>
                  <p>Password changes force immediate re-authentication</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📱</span>
                <div className="info-text">
                  <strong>Device Specific</strong>
                  <p>Each device/browser needs separate authentication</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-footer">
          <button onClick={goBack} className="back-button">
            ← Back to App
          </button>
          <p>🏏 Team Cost Tracker Admin Panel</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordAdmin;