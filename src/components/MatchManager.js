import React, { useState, useEffect } from 'react';
import { matchHistory, validatePlayerTotals } from '../utils/matchHistory';
import './MatchManager.css';

const MatchManager = ({ players, onRestoreMatch, onDeleteMatch, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [stats, setStats] = useState(null);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadStats();
      loadValidation();
    }
  }, [isOpen, players]);

  const loadHistory = () => {
    const recentHistory = matchHistory.getRecentSubmissions(30); // Last 30 days
    setHistory(recentHistory);
  };

  const loadStats = () => {
    const historyStats = matchHistory.getStats();
    setStats(historyStats);
  };

  const loadValidation = () => {
    if (players && players.length > 0) {
      const validationResults = validatePlayerTotals(players);
      setValidation(validationResults);
    }
  };

  const handleUndoMatch = (matchId) => {
    setSelectedMatch(matchId);
    setConfirmAction('undo');
    setShowConfirmDialog(true);
  };

  const handleDeleteMatch = (matchId) => {
    setSelectedMatch(matchId);
    setConfirmAction('delete');
    setShowConfirmDialog(true);
  };

  const executeAction = () => {
    try {
      if (confirmAction === 'undo') {
        const result = matchHistory.undoMatch(selectedMatch, players);
        onRestoreMatch(result.restoredPlayersData, result.matchInfo);
        
        // Calculate impact
        const undoneEntry = history.find(h => h.id === selectedMatch);
        const totalRemoved = undoneEntry?.playersSummary?.totalAmount || 0;
        const playersAffected = undoneEntry?.playersSummary?.playersWhoPlayed || 0;
        
        alert(`Match successfully undone!\n\nImpact:\n- ${playersAffected} players affected\n- ₹${totalRemoved} removed from totals\n- Player balances recalculated`);
      } else if (confirmAction === 'delete') {
        matchHistory.deleteMatch(selectedMatch);
        onDeleteMatch(selectedMatch);
        alert('Match deleted from history.');
      }
      
      loadHistory();
      loadStats();
      setShowConfirmDialog(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const clearOldHistory = () => {
    setConfirmAction('clearOld');
    setShowConfirmDialog(true);
  };

  const clearAllHistory = () => {
    setConfirmAction('clearAll');
    setShowConfirmDialog(true);
  };

  const executeClearAction = () => {
    if (confirmAction === 'clearOld') {
      const deletedCount = matchHistory.clearOldHistory(30);
      alert(`Cleared ${deletedCount} old entries (older than 30 days)`);
    } else if (confirmAction === 'clearAll') {
      matchHistory.clearHistory();
      alert('All match history cleared');
    }
    
    loadHistory();
    loadStats();
    setShowConfirmDialog(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount) => {
    return amount > 0 ? `+₹${amount}` : amount < 0 ? `-₹${Math.abs(amount)}` : '₹0';
  };

  const getStatusColor = (submissionType) => {
    switch (submissionType) {
      case 'weekend': return '#25d366';
      case 'manual': return '#007bff';
      case 'import': return '#6f42c1';
      case 'undo_backup': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="match-manager-overlay">
      <div className="match-manager">
        <div className="manager-header">
          <h2>📊 Match History & Undo</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {stats && (
          <div className="stats-section">
            <h3>📈 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Entries</span>
                <span className="stat-value">{stats.totalEntries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Weekend Submissions</span>
                <span className="stat-value">{stats.weekendSubmissions}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Manual Updates</span>
                <span className="stat-value">{stats.manualUpdates}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Imports</span>
                <span className="stat-value">{stats.imports}</span>
              </div>
            </div>
          </div>
        )}

        {validation && (
          <div className="validation-section">
            <h3>✅ Data Validation</h3>
            <div className="validation-status">
              {validation.isValid ? (
                <div className="validation-success">
                  <span className="status-icon">✅</span>
                  <span>All player totals are correctly calculated</span>
                </div>
              ) : (
                <div className="validation-error">
                  <span className="status-icon">❌</span>
                  <span>{validation.errors.length} calculation errors found</span>
                  <details className="error-details">
                    <summary>View Details</summary>
                    <ul>
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
              
              {validation.warnings.length > 0 && (
                <div className="validation-warnings">
                  <span className="status-icon">⚠️</span>
                  <span>{validation.warnings.length} status warnings</span>
                  <details className="warning-details">
                    <summary>View Warnings</summary>
                    <ul>
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="history-section">
          <div className="section-header">
            <h3>📅 Recent Submissions (Last 30 Days)</h3>
            <div className="history-actions">
              <button className="clear-old-btn" onClick={clearOldHistory}>
                🗑️ Clear Old
              </button>
              <button className="clear-all-btn" onClick={clearAllHistory}>
                ⚠️ Clear All
              </button>
            </div>
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div className="no-history">
                <p>No recent submissions found</p>
              </div>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <div className="entry-header">
                    <div className="entry-info">
                      <span 
                        className="entry-type"
                        style={{ backgroundColor: getStatusColor(entry.submissionType) }}
                      >
                        {entry.submissionType}
                      </span>
                      <span className="entry-date">{formatDate(entry.timestamp)}</span>
                    </div>
                    <div className="entry-actions">
                      <button 
                        className="undo-btn"
                        onClick={() => handleUndoMatch(entry.id)}
                        title="Undo this submission"
                      >
                        ↶ Undo
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteMatch(entry.id)}
                        title="Delete from history"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="entry-description">
                    {entry.description}
                  </div>

                  <div className="entry-summary">
                    <div className="summary-stats">
                      <span>👥 {entry.playersSummary.playersWhoPlayed} played</span>
                      <span>⏳ {entry.playersSummary.pendingCount} pending</span>
                      <span>💰 {formatAmount(entry.playersSummary.totalAmount)}</span>
                    </div>
                    {entry.playersSummary.topPlayers.length > 0 && (
                      <div className="top-players">
                        <strong>Players:</strong> {entry.playersSummary.topPlayers.join(', ')}
                        {entry.playersSummary.playersWhoPlayed > 3 && ` +${entry.playersSummary.playersWhoPlayed - 3} more`}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="confirm-overlay">
            <div className="confirm-dialog">
              <h3>⚠️ Confirm Action</h3>
              
              {confirmAction === 'undo' && (
                <div>
                  <p>This will restore player data to the state before this submission.</p>
                  <p><strong>Warning:</strong> Current changes will be backed up but may be lost.</p>
                </div>
              )}
              
              {confirmAction === 'delete' && (
                <div>
                  <p>This will permanently delete this entry from history.</p>
                  <p><strong>Note:</strong> This only removes the history record, not player data.</p>
                </div>
              )}
              
              {confirmAction === 'clearOld' && (
                <div>
                  <p>This will delete all history entries older than 30 days.</p>
                  <p>This action cannot be undone.</p>
                </div>
              )}
              
              {confirmAction === 'clearAll' && (
                <div>
                  <p><strong>Warning:</strong> This will delete ALL match history!</p>
                  <p>You will lose the ability to undo any previous submissions.</p>
                </div>
              )}

              <div className="confirm-actions">
                <button 
                  className="confirm-btn"
                  onClick={confirmAction.startsWith('clear') ? executeClearAction : executeAction}
                >
                  {confirmAction === 'undo' && 'Yes, Undo'}
                  {confirmAction === 'delete' && 'Yes, Delete'}
                  {confirmAction === 'clearOld' && 'Clear Old Entries'}
                  {confirmAction === 'clearAll' && 'Clear Everything'}
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchManager;