import React, { useState } from 'react';
import './PlayersList.css';

const PlayersList = ({ players, onAddPlayer, onRemovePlayer }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');

  const handleAddPlayer = (e) => {
    e.preventDefault();
    
    if (!newPlayerName.trim()) {
      alert('Please enter player name');
      return;
    }

    const player = {
      id: Date.now().toString() + Math.random(),
      name: newPlayerName.trim(),
      phone: newPlayerPhone.trim(),
      balance: 0,
      payments: []
    };

    onAddPlayer(player);
    setNewPlayerName('');
    setNewPlayerPhone('');
  };

  const handleRemovePlayer = (playerId) => {
    if (window.confirm('Are you sure you want to remove this player?')) {
      onRemovePlayer(playerId);
    }
  };

  return (
    <div className="players-list">
      <div className="add-player-section">
        <h3>Add New Player</h3>
        <form onSubmit={handleAddPlayer}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={newPlayerPhone}
              onChange={(e) => setNewPlayerPhone(e.target.value)}
            />
            <button type="submit" className="add-btn">Add Player</button>
          </div>
        </form>
      </div>

      <div className="players-section">
        <h3>Team Players ({players.length})</h3>
        {players.length === 0 ? (
          <p className="no-players">No players added yet. Add your first player above!</p>
        ) : (
          <div className="players-grid">
            {players.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  {player.phone && (
                    <div className="player-phone">{player.phone}</div>
                  )}
                </div>
                <button 
                  onClick={() => handleRemovePlayer(player.id)}
                  className="remove-btn"
                  title="Remove player"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersList;