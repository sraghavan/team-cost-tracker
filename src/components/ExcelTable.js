import React, { useState } from 'react';
import './ExcelTable.css';
import PlayerMaintenanceModal from './PlayerMaintenanceModal';

const ExcelTable = ({ players, onUpdatePlayer, onAddPlayer, onRemovePlayer, onUpdatePlayers }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const handleCellClick = (playerId, field) => {
    setEditingCell({ playerId, field });
  };

  const handleCellChange = (playerId, field, value) => {
    const numValue = field === 'status' ? value : (parseFloat(value) || 0);
    const player = players.find(p => p.id === playerId);
    
    // Handle balance adjustment for Saturday/Sunday changes
    if ((field === 'saturday' || field === 'sunday') && onUpdatePlayers) {
      const oldValue = player[field] || 0;
      const newValue = Math.round(numValue);
      const difference = oldValue - newValue;
      
      if (difference !== 0) {
        // Find players who played this match (have non-zero amount for this day)
        const playersWhoPlayed = players.filter(p => 
          p.id !== playerId && (p[field] || 0) > 0
        );
        
        if (playersWhoPlayed.length > 0) {
          const adjustmentPerPlayer = Math.round(difference / playersWhoPlayed.length);
          const remainder = difference - (adjustmentPerPlayer * playersWhoPlayed.length);
          
          const updatedPlayers = players.map(p => {
            if (p.id === playerId) {
              // Update the current player
              const updatedPlayer = {
                ...p,
                [field]: newValue
              };
              updatedPlayer.total = 
                (updatedPlayer.prevBalance || 0) + 
                (updatedPlayer.saturday || 0) + 
                (updatedPlayer.sunday || 0) - 
                (updatedPlayer.advPaid || 0);
              
              // Auto-set status based on total and playing status
              const hasPlayedThisWeek = (updatedPlayer.saturday || 0) > 0 || (updatedPlayer.sunday || 0) > 0;
              updatedPlayer.status = getAutoStatus(updatedPlayer.total, hasPlayedThisWeek);
              
              return updatedPlayer;
            } else if (playersWhoPlayed.find(player => player.id === p.id)) {
              // Adjust other players who played this match
              const isFirstPlayer = playersWhoPlayed[0].id === p.id;
              const adjustment = adjustmentPerPlayer + (isFirstPlayer ? remainder : 0);
              const updatedPlayer = {
                ...p,
                [field]: Math.max(0, (p[field] || 0) + adjustment)
              };
              updatedPlayer.total = 
                (updatedPlayer.prevBalance || 0) + 
                (updatedPlayer.saturday || 0) + 
                (updatedPlayer.sunday || 0) - 
                (updatedPlayer.advPaid || 0);
              
              // Auto-set status based on total and playing status
              const hasPlayedThisWeek = (updatedPlayer.saturday || 0) > 0 || (updatedPlayer.sunday || 0) > 0;
              updatedPlayer.status = getAutoStatus(updatedPlayer.total, hasPlayedThisWeek);
              
              return updatedPlayer;
            }
            return p;
          });
          
          onUpdatePlayers(updatedPlayers);
          return;
        }
      }
    }
    
    // Normal update for other fields
    const updatedPlayer = {
      ...player,
      [field]: field === 'status' ? numValue : Math.round(numValue)
    };
    
    // Special handling when status is changed to "Paid"
    if (field === 'status' && numValue === 'Paid') {
      // Calculate current amount owed
      const currentTotal = (updatedPlayer.prevBalance || 0) + 
                          (updatedPlayer.saturday || 0) + 
                          (updatedPlayer.sunday || 0) - 
                          (updatedPlayer.advPaid || 0);
      
      // If there's an amount owed, set advPaid to cover it
      if (currentTotal > 0) {
        updatedPlayer.advPaid = (updatedPlayer.prevBalance || 0) + 
                               (updatedPlayer.saturday || 0) + 
                               (updatedPlayer.sunday || 0);
      }
      
      // Recalculate total (should be 0 or negative now)
      updatedPlayer.total = (updatedPlayer.prevBalance || 0) + 
                           (updatedPlayer.saturday || 0) + 
                           (updatedPlayer.sunday || 0) - 
                           (updatedPlayer.advPaid || 0);
    }
    // Auto-calculate total for other fields
    else if (field !== 'total') {
      updatedPlayer.total = 
        (updatedPlayer.prevBalance || 0) + 
        (updatedPlayer.saturday || 0) + 
        (updatedPlayer.sunday || 0) - 
        (updatedPlayer.advPaid || 0);
      
      // Auto-set status based on total and playing status (except when manually editing status)
      if (field !== 'status') {
        const hasPlayedThisWeek = (updatedPlayer.saturday || 0) > 0 || (updatedPlayer.sunday || 0) > 0;
        updatedPlayer.status = getAutoStatus(updatedPlayer.total, hasPlayedThisWeek);
      }
    }
    
    onUpdatePlayer(updatedPlayer);
  };

  const handleKeyPress = (e, playerId, field) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        prevBalance: 0,
        saturday: 0,
        sunday: 0,
        advPaid: 0,
        total: 0,
        status: ''
      };
      onAddPlayer(newPlayer);
      setNewPlayerName('');
    }
  };

  const formatCurrency = (value) => {
    return value ? `₹${value}` : '';
  };

  const getFilteredAndSortedPlayers = (players) => {
    // First filter by status
    let filteredPlayers = [...players];
    
    if (statusFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => {
        const status = (player.status || '').toLowerCase();
        
        switch (statusFilter) {
          case 'pending':
            return status === 'pending';
          case 'partially-paid':
            return status === 'partially paid';
          case 'paid':
            return status === 'paid';
          case 'no-status':
            return status === '' || !status;
          default:
            return true;
        }
      });
    }
    
    // Then sort
    return filteredPlayers.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          const statusOrder = { 'pending': 1, 'partially paid': 2, 'paid': 3, '': 4 };
          const aStatus = (a.status || '').toLowerCase();
          const bStatus = (b.status || '').toLowerCase();
          const aOrder = statusOrder[aStatus] || 5;
          const bOrder = statusOrder[bStatus] || 5;
          
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name);
          
        case 'name':
          return a.name.localeCompare(b.name);
          
        case 'total':
          const aTotalNum = parseFloat(a.total) || 0;
          const bTotalNum = parseFloat(b.total) || 0;
          if (aTotalNum !== bTotalNum) return bTotalNum - aTotalNum; // Descending
          return a.name.localeCompare(b.name);
          
        case 'default':
        default:
          // Default sorting: players who played first, then by name
          const aPlayed = (a.saturday || 0) > 0 || (a.sunday || 0) > 0;
          const bPlayed = (b.saturday || 0) > 0 || (b.sunday || 0) > 0;
          
          if (aPlayed && !bPlayed) return -1;
          if (!aPlayed && bPlayed) return 1;
          
          return a.name.localeCompare(b.name);
      }
    });
  };

  const getAutoStatus = (total, hasPlayedThisWeek) => {
    if (!hasPlayedThisWeek) return '';
    if (total <= 0) return 'Paid';
    return 'Pending';
  };

  const handleMarkAsPaid = (playerId) => {
    handleCellChange(playerId, 'status', 'Paid');
  };

  const handleUndoPayment = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Reset amount paid to 0 and recalculate
    const updatedPlayer = {
      ...player,
      advPaid: 0,
      total: (player.prevBalance || 0) + (player.saturday || 0) + (player.sunday || 0),
      status: ''
    };
    
    onUpdatePlayer(updatedPlayer);
  };

  const EditableCell = ({ player, field, value, isNumber = true }) => {
    const isEditing = editingCell?.playerId === player.id && editingCell?.field === field;
    
    if (isEditing) {
      if (field === 'status') {
        return (
          <select
            value={value || ''}
            onChange={(e) => {
              handleCellChange(player.id, field, e.target.value);
              setEditingCell(null);
            }}
            onBlur={() => setEditingCell(null)}
            autoFocus
            className="cell-select"
          >
            <option value="">Select Status</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        );
      }
      
      return (
        <input
          type={isNumber ? 'number' : 'text'}
          value={value || ''}
          onChange={(e) => handleCellChange(player.id, field, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyPress={(e) => handleKeyPress(e, player.id, field)}
          autoFocus
          className="cell-input"
        />
      );
    }
    
    // Special handling for status field
    if (field === 'status') {
      const playerTotal = player.total || 0;
      const isPaid = value === 'Paid';
      const hasAmountOwed = playerTotal > 0;
      
      return (
        <div className="status-cell">
          <div 
            className={`cell-content ${value ? `status-${value?.toLowerCase().replace(' ', '-')}` : ''}`}
            onClick={() => handleCellClick(player.id, field)}
          >
            {value || 'Click to set'}
          </div>
          {isPaid ? (
            <button
              className="undo-icon-btn"
              onClick={() => handleUndoPayment(player.id)}
              title="Undo Payment"
            >
              ↩️
            </button>
          ) : hasAmountOwed ? (
            <button
              className="paid-icon-btn"
              onClick={() => handleMarkAsPaid(player.id)}
              title="Mark as Paid"
            >
              ✅
            </button>
          ) : null}
        </div>
      );
    }
    
    return (
      <div 
        className={`cell-content`}
        onClick={() => handleCellClick(player.id, field)}
      >
        {isNumber ? formatCurrency(value) : (value || 'Click to set')}
      </div>
    );
  };

  return (
    <div className="excel-table">
      <div className="table-header">
        <div className="header-left">
          <h2>Team Cost Tracker</h2>
          <div className="weekend-date">
            Weekend: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div className="table-controls">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter:</label>
            <select 
              id="status-filter"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="control-select"
            >
              <option value="all">All Players</option>
              <option value="pending">Pending Only</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="paid">Paid Only</option>
              <option value="no-status">No Status</option>
            </select>
          </div>
          
          <div className="sort-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="default">Default</option>
              <option value="status">Status</option>
              <option value="name">Name</option>
              <option value="total">Total Amount</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="cost-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Prev Balance</th>
              <th>Saturday</th>
              <th>Sunday</th>
              <th>Amount Paid</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedPlayers(players).map(player => (
              <tr key={player.id}>
                <td className="player-name">{player.name}</td>
                <td className="editable-cell">
                  <EditableCell player={player} field="prevBalance" value={player.prevBalance} />
                </td>
                <td className="editable-cell">
                  <EditableCell player={player} field="saturday" value={player.saturday} />
                </td>
                <td className="editable-cell">
                  <EditableCell player={player} field="sunday" value={player.sunday} />
                </td>
                <td className="editable-cell">
                  <EditableCell player={player} field="advPaid" value={player.advPaid} />
                </td>
                <td className="total-cell">
                  {formatCurrency(player.total)}
                </td>
                <td className="editable-cell">
                  <EditableCell player={player} field="status" value={player.status} isNumber={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {players.length === 0 && (
        <div className="empty-table">
          <p>No players added yet. Add your first player above!</p>
        </div>
      )}
      
      <PlayerMaintenanceModal 
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        players={players}
        onDeletePlayer={onRemovePlayer}
        onAddPlayer={onAddPlayer}
      />
    </div>
  );
};

export default ExcelTable;