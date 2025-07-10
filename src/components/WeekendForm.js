import React, { useState } from 'react';
import './WeekendForm.css';

const WeekendForm = ({ players, onUpdatePlayers, onAddPlayer }) => {
  const [weekendCosts, setWeekendCosts] = useState({
    saturdayGround: '',
    saturdayCafeteria: '',
    sundayGround: '',
    sundayCafeteria: ''
  });

  const [selectedPlayers, setSelectedPlayers] = useState({
    saturday: [],
    sunday: []
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState({
    saturday: 'MICC',
    sunday: 'SADHOOZ'
  });

  const [matchDates, setMatchDates] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to subtract to get to last Saturday
    const daysToLastSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1; // If Sunday, last Saturday was 1 day ago, else dayOfWeek + 1
    const lastSaturday = new Date(today.getTime() - (daysToLastSaturday * 24 * 60 * 60 * 1000));
    
    // Last Sunday is the day after last Saturday
    const lastSunday = new Date(lastSaturday.getTime() + (24 * 60 * 60 * 1000));
    
    return {
      saturday: lastSaturday.toISOString().split('T')[0],
      sunday: lastSunday.toISOString().split('T')[0]
    };
  });

  const [matchHistory, setMatchHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('matchHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  const [selectedHistoryId, setSelectedHistoryId] = useState('');

  const handleCostChange = (field, value) => {
    setWeekendCosts(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlayerSelection = (day, playerId, checked) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [day]: checked 
        ? [...prev[day], playerId]
        : prev[day].filter(id => id !== playerId)
    }));
  };

  const handleAddNewPlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now().toString() + Math.random(),
        name: newPlayerName.trim(),
        prevBalance: 0,
        saturday: 0,
        sunday: 0,
        advPaid: 0,
        total: 0,
        status: '',
        matchDates: {
          saturday: matchDates.saturday,
          sunday: matchDates.sunday
        }
      };
      onAddPlayer(newPlayer);
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const handleApplyToAll = () => {
    const saturdayTotal = (parseFloat(weekendCosts.saturdayGround) || 0) + 
                         (parseFloat(weekendCosts.saturdayCafeteria) || 0);
    const sundayTotal = (parseFloat(weekendCosts.sundayGround) || 0) + 
                       (parseFloat(weekendCosts.sundayCafeteria) || 0);

    if (saturdayTotal === 0 && sundayTotal === 0) {
      alert('Please enter at least one cost amount');
      return;
    }

    if (saturdayTotal > 0 && selectedPlayers.saturday.length === 0) {
      alert('Please select players for Saturday match');
      return;
    }

    if (sundayTotal > 0 && selectedPlayers.sunday.length === 0) {
      alert('Please select players for Sunday match');
      return;
    }

    const saturdayPerPlayer = selectedPlayers.saturday.length > 0 ? Math.round(saturdayTotal / selectedPlayers.saturday.length) : 0;
    const sundayPerPlayer = selectedPlayers.sunday.length > 0 ? Math.round(sundayTotal / selectedPlayers.sunday.length) : 0;

    const updatedPlayers = players.map(player => {
      const saturdayAmount = selectedPlayers.saturday.includes(player.id) ? saturdayPerPlayer : 0;
      const sundayAmount = selectedPlayers.sunday.includes(player.id) ? sundayPerPlayer : 0;
      
      const total = (player.prevBalance || 0) + saturdayAmount + sundayAmount - (player.advPaid || 0);
      const hasPlayedThisWeek = saturdayAmount > 0 || sundayAmount > 0;
      
      return {
        ...player,
        saturday: saturdayAmount,
        sunday: sundayAmount,
        total: total,
        status: getAutoStatus(total, hasPlayedThisWeek),
        matchDates: {
          saturday: matchDates.saturday,
          sunday: matchDates.sunday
        }
      };
    });

    onUpdatePlayers(updatedPlayers);
    
    // Save to match history
    saveMatchHistory(updatedPlayers, matchDates, selectedTeams, weekendCosts);
    
    setWeekendCosts({ 
      saturdayGround: '', 
      saturdayCafeteria: '', 
      sundayGround: '', 
      sundayCafeteria: '' 
    });
    setSelectedPlayers({
      saturday: [],
      sunday: []
    });
  };

  const handleResetWeekend = () => {
    if (window.confirm('Reset all weekend costs to 0?')) {
      const updatedPlayers = players.map(player => {
        const total = (player.prevBalance || 0) - (player.advPaid || 0);
        return {
          ...player,
          saturday: 0,
          sunday: 0,
          total: total,
          status: getAutoStatus(total, false)
        };
      });
      onUpdatePlayers(updatedPlayers);
      setSelectedPlayers({
        saturday: [],
        sunday: []
      });
    }
  };

  const handleMoveToNextWeek = () => {
    if (window.confirm('Move current totals to Previous Balance and reset weekend costs?')) {
      const updatedPlayers = players.map(player => ({
        ...player,
        prevBalance: player.total || 0,
        saturday: 0,
        sunday: 0,
        total: player.total || 0,
        status: player.status === 'Paid' ? 'Pending' : player.status
      }));
      onUpdatePlayers(updatedPlayers);
      setSelectedPlayers({
        saturday: [],
        sunday: []
      });
    }
  };

  const getSaturdayTotal = () => {
    return (parseFloat(weekendCosts.saturdayGround) || 0) + (parseFloat(weekendCosts.saturdayCafeteria) || 0);
  };

  const getSundayTotal = () => {
    return (parseFloat(weekendCosts.sundayGround) || 0) + (parseFloat(weekendCosts.sundayCafeteria) || 0);
  };

  const getSaturdayPerPlayer = () => {
    const total = getSaturdayTotal();
    return selectedPlayers.saturday.length > 0 ? Math.round(total / selectedPlayers.saturday.length) : 0;
  };

  const getSundayPerPlayer = () => {
    const total = getSundayTotal();
    return selectedPlayers.sunday.length > 0 ? Math.round(total / selectedPlayers.sunday.length) : 0;
  };

  const getRegularPlayersForTeam = (team) => {
    const miccPlayers = [
      'Kamal Karwal', 'Anjeev', 'Sailesh', 'Nikhil', 'Shyam', 'Sagar', 'Parag', 
      'Sudhir', 'Baram (Gullu)', 'Ashish Sikka', 'Bhanu', 'Shantanu', 'Sunil Anna', 'Avinash'
    ];
    
    const sadhoozPlayers = [
      'Kamal Karwal', 'Anjeev', 'Sailesh', 'Nikhil', 'Shyam', 'PK', 'Amit Tyagi', 
      'Sudhir', 'Baram (Gullu)', 'Harjinder', 'Vijay Lal', 'Aryan', 'Sunil Anna', 'Avinash'
    ];
    
    const regularPlayerNames = team === 'MICC' ? miccPlayers : team === 'SADHOOZ' ? sadhoozPlayers : [];
    
    return players.filter(player => regularPlayerNames.includes(player.name));
  };

  const getOtherPlayersForTeam = (team) => {
    const regularPlayers = getRegularPlayersForTeam(team);
    const regularPlayerIds = regularPlayers.map(p => p.id);
    return players.filter(player => !regularPlayerIds.includes(player.id));
  };

  const handleSelectAllRegular = (day, team) => {
    const regularPlayers = getRegularPlayersForTeam(team);
    const regularPlayerIds = regularPlayers.map(p => p.id);
    
    setSelectedPlayers(prev => ({
      ...prev,
      [day]: [...new Set([...prev[day], ...regularPlayerIds])]
    }));
  };

  const handleDeselectAllRegular = (day, team) => {
    const regularPlayers = getRegularPlayersForTeam(team);
    const regularPlayerIds = regularPlayers.map(p => p.id);
    
    setSelectedPlayers(prev => ({
      ...prev,
      [day]: prev[day].filter(id => !regularPlayerIds.includes(id))
    }));
  };

  const handleSelectAllOther = (day, team) => {
    const otherPlayers = getOtherPlayersForTeam(team);
    const otherPlayerIds = otherPlayers.map(p => p.id);
    
    setSelectedPlayers(prev => ({
      ...prev,
      [day]: [...new Set([...prev[day], ...otherPlayerIds])]
    }));
  };

  const handleDeselectAllOther = (day, team) => {
    const otherPlayers = getOtherPlayersForTeam(team);
    const otherPlayerIds = otherPlayers.map(p => p.id);
    
    setSelectedPlayers(prev => ({
      ...prev,
      [day]: prev[day].filter(id => !otherPlayerIds.includes(id))
    }));
  };

  const getAutoStatus = (total, hasPlayedThisWeek) => {
    if (!hasPlayedThisWeek) return '';
    if (total <= 0) return 'Paid';
    return 'Pending';
  };

  const handleDateChange = (day, date) => {
    setMatchDates(prev => ({
      ...prev,
      [day]: date
    }));
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const saveMatchHistory = (players, dates, teams, costs) => {
    const historyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      matchDates: dates,
      teams: teams,
      costs: costs,
      players: players.filter(p => (p.saturday || 0) > 0 || (p.sunday || 0) > 0), // Only save players who played
      totalPlayers: players.filter(p => (p.saturday || 0) > 0 || (p.sunday || 0) > 0).length,
      totalAmount: players.reduce((sum, p) => sum + (p.saturday || 0) + (p.sunday || 0), 0)
    };

    const updatedHistory = [historyEntry, ...matchHistory].slice(0, 20); // Keep last 20 entries
    setMatchHistory(updatedHistory);
    localStorage.setItem('matchHistory', JSON.stringify(updatedHistory));
  };

  const loadMatchHistory = (historyId) => {
    const entry = matchHistory.find(h => h.id === historyId);
    if (entry) {
      // This is read-only mode - just show the historical data
      // We'll display this data in a modal or separate section
      return entry;
    }
    return null;
  };

  const restoreMatchHistory = (historyId) => {
    const entry = matchHistory.find(h => h.id === historyId);
    if (entry && window.confirm('Restore this match data? This will overwrite current player amounts.')) {
      // First restore the form settings
      setMatchDates(entry.matchDates);
      setSelectedTeams(entry.teams);
      setWeekendCosts(entry.costs);
      
      // Set selected players based on who played in that match
      const saturdayPlayers = entry.players.filter(p => (p.saturday || 0) > 0).map(p => p.id);
      const sundayPlayers = entry.players.filter(p => (p.sunday || 0) > 0).map(p => p.id);
      
      setSelectedPlayers({
        saturday: saturdayPlayers,
        sunday: sundayPlayers
      });

      // Now restore the actual player amounts
      const updatedPlayers = players.map(currentPlayer => {
        const historicalPlayer = entry.players.find(hp => hp.name === currentPlayer.name);
        if (historicalPlayer) {
          return {
            ...currentPlayer,
            saturday: historicalPlayer.saturday || 0,
            sunday: historicalPlayer.sunday || 0,
            total: historicalPlayer.total || 0,
            status: historicalPlayer.status || '',
            matchDates: entry.matchDates
          };
        }
        return currentPlayer;
      });

      onUpdatePlayers(updatedPlayers);
      
      // Clear the selection after restoring
      setSelectedHistoryId('');
    }
  };

  return (
    <div className="weekend-form">
      <h3>Weekend Match Costs</h3>
      <p className="form-description">Enter costs and select players for each match. Costs will be split equally among selected players.</p>
      
      {matchHistory.length > 0 && (
        <div className="match-history-section">
          <div className="history-header">
            <h4>Match History</h4>
            <div className="history-controls">
              <select 
                value={selectedHistoryId} 
                onChange={(e) => setSelectedHistoryId(e.target.value)}
                className="history-dropdown"
              >
                <option value="">Select previous match...</option>
                {matchHistory.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {formatDisplayDate(entry.matchDates.saturday)} & {formatDisplayDate(entry.matchDates.sunday)} - 
                    {entry.totalPlayers} players, ₹{entry.totalAmount}
                  </option>
                ))}
              </select>
              {selectedHistoryId && (
                <button 
                  onClick={() => restoreMatchHistory(selectedHistoryId)}
                  className="restore-btn"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
          
          {selectedHistoryId && (
            <div className="history-preview">
              {(() => {
                const entry = loadMatchHistory(selectedHistoryId);
                if (!entry) return null;
                
                return (
                  <div className="history-details">
                    <div className="history-info">
                      <span><strong>Match 1:</strong> {formatDisplayDate(entry.matchDates.saturday)} ({entry.teams.saturday})</span>
                      <span><strong>Match 2:</strong> {formatDisplayDate(entry.matchDates.sunday)} ({entry.teams.sunday})</span>
                      <span><strong>Total Cost:</strong> ₹{entry.totalAmount}</span>
                      <span><strong>Players:</strong> {entry.totalPlayers}</span>
                    </div>
                    <div className="history-costs">
                      <div><strong>Match 1:</strong> Ground ₹{entry.costs.saturdayGround || 0}, Cafeteria ₹{entry.costs.saturdayCafeteria || 0}</div>
                      <div><strong>Match 2:</strong> Ground ₹{entry.costs.sundayGround || 0}, Cafeteria ₹{entry.costs.sundayCafeteria || 0}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
      
      <div className="cost-inputs">
        <div className="day-section">
          <h4>Match 1 ({formatDisplayDate(matchDates.saturday)})</h4>
          
          <div className="match-details">
            <div className="date-selector">
              <label htmlFor="saturday-date-select">Date:</label>
              <input
                type="date"
                id="saturday-date-select"
                value={matchDates.saturday}
                onChange={(e) => handleDateChange('saturday', e.target.value)}
                className="date-input"
              />
            </div>
            
            <div className="team-selector">
              <label htmlFor="saturday-team-select">Team:</label>
              <select 
                id="saturday-team-select"
                value={selectedTeams.saturday} 
                onChange={(e) => setSelectedTeams(prev => ({...prev, saturday: e.target.value}))}
                className="team-dropdown"
              >
                <option value="MICC">MICC</option>
                <option value="SADHOOZ">SADHOOZ</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
          
          <div className="day-costs">
            <div className="cost-input-group">
              <label>Ground:</label>
              <input
                type="number"
                placeholder="0"
                value={weekendCosts.saturdayGround}
                onChange={(e) => handleCostChange('saturdayGround', e.target.value)}
                step="0.01"
              />
            </div>
            <div className="cost-input-group">
              <label>Cafeteria:</label>
              <input
                type="number"
                placeholder="0"
                value={weekendCosts.saturdayCafeteria}
                onChange={(e) => handleCostChange('saturdayCafeteria', e.target.value)}
                step="0.01"
              />
            </div>
          </div>
          <div className="day-total">
            Total: ₹{getSaturdayTotal()} 
            {selectedPlayers.saturday.length > 0 && (
              <span className="per-player"> (₹{getSaturdayPerPlayer()}/player)</span>
            )}
          </div>
          
          <div className="player-selection">
            <div className="selection-header">
              <label>Players ({selectedPlayers.saturday.length} selected):</label>
              <button 
                type="button" 
                onClick={() => setShowAddPlayer(true)}
                className="add-player-btn"
              >
                + Add Player
              </button>
            </div>
            
            <div className="player-buckets">
              <div className="player-bucket">
                <div className="bucket-header">
                  <h5>Regular Players</h5>
                  <div className="bucket-buttons">
                    <button 
                      type="button" 
                      onClick={() => handleSelectAllRegular('saturday', selectedTeams.saturday)}
                      className="select-all-btn"
                    >
                      Select All
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeselectAllRegular('saturday', selectedTeams.saturday)}
                      className="deselect-all-btn"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="players-grid">
                  {getRegularPlayersForTeam(selectedTeams.saturday).map(player => (
                    <label key={player.id} className="player-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.saturday.includes(player.id)}
                        onChange={(e) => handlePlayerSelection('saturday', player.id, e.target.checked)}
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="player-bucket">
                <div className="bucket-header">
                  <h5>Other Players</h5>
                  <div className="bucket-buttons">
                    <button 
                      type="button" 
                      onClick={() => handleSelectAllOther('saturday', selectedTeams.saturday)}
                      className="select-all-btn"
                    >
                      Select All
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeselectAllOther('saturday', selectedTeams.saturday)}
                      className="deselect-all-btn"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="players-grid">
                  {getOtherPlayersForTeam(selectedTeams.saturday).map(player => (
                    <label key={player.id} className="player-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.saturday.includes(player.id)}
                        onChange={(e) => handlePlayerSelection('saturday', player.id, e.target.checked)}
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="day-section">
          <h4>Match 2 ({formatDisplayDate(matchDates.sunday)})</h4>
          
          <div className="match-details">
            <div className="date-selector">
              <label htmlFor="sunday-date-select">Date:</label>
              <input
                type="date"
                id="sunday-date-select"
                value={matchDates.sunday}
                onChange={(e) => handleDateChange('sunday', e.target.value)}
                className="date-input"
              />
            </div>
            
            <div className="team-selector">
              <label htmlFor="sunday-team-select">Team:</label>
              <select 
                id="sunday-team-select"
                value={selectedTeams.sunday} 
                onChange={(e) => setSelectedTeams(prev => ({...prev, sunday: e.target.value}))}
                className="team-dropdown"
              >
                <option value="MICC">MICC</option>
                <option value="SADHOOZ">SADHOOZ</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
          
          <div className="day-costs">
            <div className="cost-input-group">
              <label>Ground:</label>
              <input
                type="number"
                placeholder="0"
                value={weekendCosts.sundayGround}
                onChange={(e) => handleCostChange('sundayGround', e.target.value)}
                step="0.01"
              />
            </div>
            <div className="cost-input-group">
              <label>Cafeteria:</label>
              <input
                type="number"
                placeholder="0"
                value={weekendCosts.sundayCafeteria}
                onChange={(e) => handleCostChange('sundayCafeteria', e.target.value)}
                step="0.01"
              />
            </div>
          </div>
          <div className="day-total">
            Total: ₹{getSundayTotal()}
            {selectedPlayers.sunday.length > 0 && (
              <span className="per-player"> (₹{getSundayPerPlayer()}/player)</span>
            )}
          </div>
          
          <div className="player-selection">
            <div className="selection-header">
              <label>Players ({selectedPlayers.sunday.length} selected):</label>
              <button 
                type="button" 
                onClick={() => setShowAddPlayer(true)}
                className="add-player-btn"
              >
                + Add Player
              </button>
            </div>
            
            <div className="player-buckets">
              <div className="player-bucket">
                <div className="bucket-header">
                  <h5>Regular Players</h5>
                  <div className="bucket-buttons">
                    <button 
                      type="button" 
                      onClick={() => handleSelectAllRegular('sunday', selectedTeams.sunday)}
                      className="select-all-btn"
                    >
                      Select All
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeselectAllRegular('sunday', selectedTeams.sunday)}
                      className="deselect-all-btn"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="players-grid">
                  {getRegularPlayersForTeam(selectedTeams.sunday).map(player => (
                    <label key={player.id} className="player-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.sunday.includes(player.id)}
                        onChange={(e) => handlePlayerSelection('sunday', player.id, e.target.checked)}
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="player-bucket">
                <div className="bucket-header">
                  <h5>Other Players</h5>
                  <div className="bucket-buttons">
                    <button 
                      type="button" 
                      onClick={() => handleSelectAllOther('sunday', selectedTeams.sunday)}
                      className="select-all-btn"
                    >
                      Select All
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeselectAllOther('sunday', selectedTeams.sunday)}
                      className="deselect-all-btn"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="players-grid">
                  {getOtherPlayersForTeam(selectedTeams.sunday).map(player => (
                    <label key={player.id} className="player-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.sunday.includes(player.id)}
                        onChange={(e) => handlePlayerSelection('sunday', player.id, e.target.checked)}
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="action-section">
          <button 
            onClick={handleApplyToAll}
            className="apply-btn"
          >
            Apply to Selected Players
          </button>
        </div>
      </div>

      <div className="weekend-actions">
        <button 
          onClick={handleResetWeekend}
          className="reset-btn"
        >
          Reset Weekend
        </button>
        
        <button 
          onClick={handleMoveToNextWeek}
          className="next-week-btn"
        >
          Move to Next Week
        </button>
      </div>

      {showAddPlayer && (
        <div className="modal-overlay" onClick={() => setShowAddPlayer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Add New Player</h4>
              <button 
                className="modal-close"
                onClick={() => setShowAddPlayer(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddNewPlayer} className="modal-form">
              <div className="form-group">
                <label htmlFor="playerName">Player Name:</label>
                <input
                  id="playerName"
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddPlayer(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekendForm;