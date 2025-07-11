import React, { useState, useEffect } from 'react';
import { usePasswordManager } from '../hooks/usePasswordManager';
import './PasswordProtection.css';

const PasswordProtection = ({ onAuthenticated }) => {
  const { getStoredPassword, currentPassword } = usePasswordManager();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = sessionStorage.getItem('appAuthenticated');
    if (isAuthenticated === 'true') {
      onAuthenticated();
    }
  }, [onAuthenticated]);


  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate slight delay for better UX
    setTimeout(() => {
      const storedPassword = getStoredPassword();
      
      if (password === storedPassword) {
        // Store authentication in session (expires when browser closes)
        sessionStorage.setItem('appAuthenticated', 'true');
        sessionStorage.setItem('authTime', Date.now());
        onAuthenticated();
      } else {
        setError('Incorrect password. Try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };


  return (
    <div className="password-protection">
      <div className="auth-container">
        <div className="auth-header">
          <div className="app-logo">🏏</div>
          <h1>Team Cost Tracker</h1>
          <p>Please enter the password to access the app</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Checking...
              </>
            ) : (
              'Access App'
            )}
          </button>

        </form>

        <div className="auth-footer">
          <p>🔒 Secure access to your cricket team finances</p>
          <div className="features">
            <span>📊 Match Cost Tracking</span>
            <span>📱 WhatsApp Integration</span>
            <span>🔄 Undo System</span>
            <span>🔔 Push Notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordProtection;