import React, { useState } from 'react';
import './MatchForm.css';

const MatchForm = ({ players, onAddMatch, onAddPlayer }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    team1: '',
    team2: '',
    groundCost: '',
    cafeteriaCost: '',
    groundPaidBy: '',
    cafeteriaPaidBy: '',
    participants: []
  });

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.team1 || !formData.team2 || formData.participants.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const match = {
      id: Date.now().toString(),
      date: formData.date,
      team1: formData.team1,
      team2: formData.team2,
      expenses: {
        ground: parseFloat(formData.groundCost) || 0,
        cafeteria: parseFloat(formData.cafeteriaCost) || 0
      },
      paidBy: {
        ground: formData.groundPaidBy || null,
        cafeteria: formData.cafeteriaPaidBy || null
      },
      participants: formData.participants
    };

    onAddMatch(match);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      team1: '',
      team2: '',
      groundCost: '',
      cafeteriaCost: '',
      groundPaidBy: '',
      cafeteriaPaidBy: '',
      participants: []
    });
  };

  const handleParticipantChange = (playerId, checked) => {
    setFormData(prev => ({
      ...prev,
      participants: checked 
        ? [...prev.participants, playerId]
        : prev.participants.filter(id => id !== playerId)
    }));
  };

  const handleAddNewPlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now().toString() + Math.random(),
        name: newPlayerName.trim(),
        phone: '',
        balance: 0,
        payments: []
      };
      onAddPlayer(newPlayer);
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const selectAllPlayers = () => {
    setFormData(prev => ({
      ...prev,
      participants: players.map(player => player.id)
    }));
  };

  const clearAllPlayers = () => {
    setFormData(prev => ({
      ...prev,
      participants: []
    }));
  };

  return (
    <div className="match-form">
      <h2>Add New Match</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Team 1:</label>
            <input
              type="text"
              value={formData.team1}
              onChange={(e) => setFormData({...formData, team1: e.target.value})}
              placeholder="Team 1 name"
              required
            />
          </div>
          <div className="form-group">
            <label>Team 2:</label>
            <input
              type="text"
              value={formData.team2}
              onChange={(e) => setFormData({...formData, team2: e.target.value})}
              placeholder="Team 2 name"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ground Cost:</label>
            <input
              type="number"
              value={formData.groundCost}
              onChange={(e) => setFormData({...formData, groundCost: e.target.value})}
              placeholder="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Cafeteria Cost:</label>
            <input
              type="number"
              value={formData.cafeteriaCost}
              onChange={(e) => setFormData({...formData, cafeteriaCost: e.target.value})}
              placeholder="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ground Paid By:</label>
            <select
              value={formData.groundPaidBy}
              onChange={(e) => setFormData({...formData, groundPaidBy: e.target.value})}
            >
              <option value="">Select player</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cafeteria Paid By:</label>
            <select
              value={formData.cafeteriaPaidBy}
              onChange={(e) => setFormData({...formData, cafeteriaPaidBy: e.target.value})}
            >
              <option value="">Select player</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <div className="participants-header">
            <label>Participants ({formData.participants.length} selected):</label>
            <div className="participant-controls">
              <button type="button" onClick={selectAllPlayers} className="control-btn">Select All</button>
              <button type="button" onClick={clearAllPlayers} className="control-btn">Clear All</button>
              <button type="button" onClick={() => setShowAddPlayer(!showAddPlayer)} className="control-btn add-player-btn">
                {showAddPlayer ? 'Cancel' : '+ Add Player'}
              </button>
            </div>
          </div>

          {showAddPlayer && (
            <div className="add-player-form">
              <form onSubmit={handleAddNewPlayer}>
                <div className="add-player-row">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="New player name"
                    required
                  />
                  <button type="submit" className="add-btn">Add</button>
                </div>
              </form>
            </div>
          )}

          <div className="participants-grid">
            {players.map(player => (
              <label key={player.id} className="participant-checkbox">
                <input
                  type="checkbox"
                  checked={formData.participants.includes(player.id)}
                  onChange={(e) => handleParticipantChange(player.id, e.target.checked)}
                />
                {player.name}
              </label>
            ))}
          </div>

          {players.length === 0 && (
            <p className="no-players-msg">No players available. Add players first using the + Add Player button above.</p>
          )}
        </div>

        <button type="submit" className="submit-btn">Add Match</button>
      </form>
    </div>
  );
};

export default MatchForm;