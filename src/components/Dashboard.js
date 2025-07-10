import React from 'react';
import { calculatePlayerBalance } from '../utils/dataStructure';
import './Dashboard.css';

const Dashboard = ({ players, matches, payments }) => {
  const playersWithBalances = players.map(player => ({
    ...player,
    balance: calculatePlayerBalance(player, matches, payments)
  }));

  const currentWeek = new Date();
  const weekStart = new Date(currentWeek);
  weekStart.setDate(currentWeek.getDate() - currentWeek.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const currentWeekMatches = matches.filter(match => {
    const matchDate = new Date(match.date);
    return matchDate >= weekStart && matchDate <= weekEnd;
  });

  const totalCurrentWeekExpenses = currentWeekMatches.reduce((total, match) => {
    return total + match.expenses.ground + match.expenses.cafeteria;
  }, 0);

  const totalPendingAmount = playersWithBalances.reduce((total, player) => {
    return total + (player.balance < 0 ? Math.abs(player.balance) : 0);
  }, 0);

  const totalAdvanceAmount = playersWithBalances.reduce((total, player) => {
    return total + (player.balance > 0 ? player.balance : 0);
  }, 0);

  const formatCurrency = (amount) => {
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  const getBalanceStatus = (balance) => {
    if (balance < 0) return 'owes';
    if (balance > 0) return 'advance';
    return 'settled';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Team Cost Tracker</h2>
        <div className="week-info">
          Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Current Week</h3>
          <div className="amount current-week">{formatCurrency(totalCurrentWeekExpenses)}</div>
          <div className="subtitle">{currentWeekMatches.length} matches</div>
        </div>
        
        <div className="summary-card">
          <h3>Total Pending</h3>
          <div className="amount pending">{formatCurrency(totalPendingAmount)}</div>
          <div className="subtitle">To be collected</div>
        </div>
        
        <div className="summary-card">
          <h3>Total Advance</h3>
          <div className="amount advance">{formatCurrency(totalAdvanceAmount)}</div>
          <div className="subtitle">Paid in advance</div>
        </div>
      </div>

      <div className="players-section">
        <h3>Player Balances</h3>
        <div className="players-grid">
          {playersWithBalances.map(player => (
            <div key={player.id} className={`player-card ${getBalanceStatus(player.balance)}`}>
              <div className="player-name">{player.name}</div>
              <div className="player-balance">
                {player.balance === 0 ? (
                  <span className="settled">Settled</span>
                ) : player.balance < 0 ? (
                  <span className="owes">Owes {formatCurrency(player.balance)}</span>
                ) : (
                  <span className="advance">Advance {formatCurrency(player.balance)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentWeekMatches.length > 0 && (
        <div className="current-week-matches">
          <h3>This Week's Matches</h3>
          <div className="matches-list">
            {currentWeekMatches.map(match => (
              <div key={match.id} className="match-item">
                <div className="match-header">
                  <span className="match-date">{new Date(match.date).toLocaleDateString()}</span>
                  <span className="match-teams">{match.team1} vs {match.team2}</span>
                </div>
                <div className="match-expenses">
                  <span>Ground: {formatCurrency(match.expenses.ground)}</span>
                  <span>Cafeteria: {formatCurrency(match.expenses.cafeteria)}</span>
                  <span className="total">Total: {formatCurrency(match.expenses.ground + match.expenses.cafeteria)}</span>
                </div>
                <div className="match-participants">
                  {match.participants.length} players
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;