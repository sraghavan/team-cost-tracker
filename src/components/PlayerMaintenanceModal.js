import React, { useState, useEffect } from 'react';
import './PlayerMaintenanceModal.css';

const PlayerMaintenanceModal = ({ isOpen, onClose, players, onDeletePlayer, onAddPlayer }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
      setShowAddForm(false);
    }
  };

  const handleDeletePlayer = (playerId) => {
    if (window.confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      onDeletePlayer(playerId);
    }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    background: 'white',
    borderRadius: '12px',
    width: windowWidth < 768 ? '95vw' : windowWidth < 1200 ? '85vw' : '90vw',
    maxWidth: windowWidth < 768 ? 'none' : '1400px',
    height: windowWidth < 768 ? '90vh' : '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    border: '4px solid #007bff'
  };

  const bodyStyle = {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0
  };

  const getGridColumns = () => {
    if (windowWidth < 768) return '1fr';
    if (windowWidth < 1200) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: getGridColumns(),
    gap: windowWidth < 768 ? '8px' : '12px',
    flex: 1,
    overflowY: 'auto',
    padding: windowWidth < 768 ? '8px' : '4px',
    minHeight: 0,
    maxHeight: '100%'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Player Maintenance</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div style={bodyStyle}>
          {/* Add Player Section */}
          <div className="add-player-section">
            {!showAddForm ? (
              <button 
                className="add-player-btn"
                onClick={() => setShowAddForm(true)}
              >
                + Add New Player
              </button>
            ) : (
              <div className="add-player-form">
                <input
                  type="text"
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                  autoFocus
                />
                <div className="form-actions">
                  <button className="save-btn" onClick={handleAddPlayer}>
                    Save
                  </button>
                  <button 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowAddForm(false);
                      setNewPlayerName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="players-list">
            <h3>Current Players ({players.length})</h3>
            {players.length === 0 ? (
              <p className="no-players">No players added yet.</p>
            ) : (
              <div style={gridStyle}>
                {players.map((player) => (
                  <div key={player.id} className="player-item">
                    <div className="player-info">
                      <span className="player-name">{player.name}</span>
                      <span className="player-balance">
                        Balance: ₹{player.total.toFixed(2)}
                      </span>
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeletePlayer(player.id)}
                      title="Delete player"
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: windowWidth < 768 ? '6px 8px' : '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: windowWidth < 768 ? '14px' : '16px',
                        fontWeight: '600',
                        minWidth: windowWidth < 768 ? '60px' : '70px',
                        flexShrink: 0
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMaintenanceModal;