// Match history and undo system utilities
export class MatchHistory {
  constructor() {
    this.storageKey = 'matchHistory';
    this.maxHistoryEntries = 50; // Keep last 50 match submissions
  }

  // Save a match submission to history
  saveMatchSubmission(matchData, playersData, submissionType = 'weekend') {
    const historyEntry = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      submissionType, // 'weekend', 'manual', 'import', etc.
      matchData: JSON.parse(JSON.stringify(matchData)), // Deep copy
      playersData: JSON.parse(JSON.stringify(playersData)), // Deep copy
      description: this.generateDescription(matchData, submissionType),
      playersSummary: this.generatePlayersSummary(playersData)
    };

    const history = this.getHistory();
    history.unshift(historyEntry); // Add to beginning

    // Keep only max entries
    if (history.length > this.maxHistoryEntries) {
      history.splice(this.maxHistoryEntries);
    }

    this.saveHistory(history);
    return historyEntry.id;
  }

  // Get all match history
  getHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading match history:', error);
      return [];
    }
  }

  // Save history to localStorage
  saveHistory(history) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving match history:', error);
    }
  }

  // Delete a specific match from history
  deleteMatch(matchId) {
    const history = this.getHistory();
    const updatedHistory = history.filter(entry => entry.id !== matchId);
    this.saveHistory(updatedHistory);
    return updatedHistory;
  }

  // Get a specific match by ID
  getMatch(matchId) {
    const history = this.getHistory();
    return history.find(entry => entry.id === matchId);
  }

  // Undo a match (restore previous state)
  undoMatch(matchId, currentPlayersData) {
    const match = this.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found in history');
    }

    // Create undo entry for current state before reverting
    this.saveMatchSubmission(
      { action: 'undo_preparation', targetMatchId: matchId },
      currentPlayersData,
      'undo_backup'
    );

    // Return the players data from before this match
    return {
      restoredPlayersData: match.playersData,
      matchInfo: match
    };
  }

  // Clear all history
  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }

  // Clear history older than specified days
  clearOldHistory(daysOld = 30) {
    const history = this.getHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filteredHistory = history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate > cutoffDate;
    });

    this.saveHistory(filteredHistory);
    return history.length - filteredHistory.length; // Return number deleted
  }

  // Generate human-readable description
  generateDescription(matchData, submissionType) {
    switch (submissionType) {
      case 'weekend':
        const satDate = matchData.saturday ? new Date(matchData.saturday).toLocaleDateString() : '';
        const sunDate = matchData.sunday ? new Date(matchData.sunday).toLocaleDateString() : '';
        return `Weekend submission: ${satDate} & ${sunDate}`;
      case 'manual':
        return 'Manual player data update';
      case 'import':
        return 'Data imported from file';
      case 'undo_backup':
        return `Backup before undo operation (Target: ${matchData.targetMatchId})`;
      default:
        return `${submissionType} submission`;
    }
  }

  // Generate players summary for quick reference
  generatePlayersSummary(playersData) {
    const playersWhoPlayed = playersData.filter(player => 
      (player.saturday || 0) > 0 || (player.sunday || 0) > 0
    );

    const pendingCount = playersWhoPlayed.filter(p => p.status === 'Pending').length;
    const partialCount = playersWhoPlayed.filter(p => p.status === 'Partially Paid').length;
    const paidCount = playersWhoPlayed.filter(p => p.status === 'Paid').length;

    const totalAmount = playersWhoPlayed.reduce((sum, player) => sum + (player.total || 0), 0);

    return {
      totalPlayers: playersData.length,
      playersWhoPlayed: playersWhoPlayed.length,
      pendingCount,
      partialCount,
      paidCount,
      totalAmount,
      topPlayers: playersWhoPlayed
        .filter(p => (p.saturday || 0) > 0 || (p.sunday || 0) > 0)
        .slice(0, 3)
        .map(p => p.name)
    };
  }

  // Get recent submissions (last N days)
  getRecentSubmissions(days = 7) {
    const history = this.getHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate > cutoffDate && entry.submissionType !== 'undo_backup';
    });
  }

  // Get statistics
  getStats() {
    const history = this.getHistory();
    const weekendSubmissions = history.filter(h => h.submissionType === 'weekend');
    const manualUpdates = history.filter(h => h.submissionType === 'manual');
    const imports = history.filter(h => h.submissionType === 'import');

    return {
      totalEntries: history.length,
      weekendSubmissions: weekendSubmissions.length,
      manualUpdates: manualUpdates.length,
      imports: imports.length,
      oldestEntry: history.length > 0 ? history[history.length - 1].timestamp : null,
      newestEntry: history.length > 0 ? history[0].timestamp : null
    };
  }

  // Validate history integrity
  validateHistory() {
    const history = this.getHistory();
    const issues = [];

    history.forEach((entry, index) => {
      if (!entry.id || !entry.timestamp || !entry.playersData) {
        issues.push(`Entry ${index}: Missing required fields`);
      }

      if (!Array.isArray(entry.playersData)) {
        issues.push(`Entry ${index}: Invalid players data format`);
      }

      try {
        new Date(entry.timestamp);
      } catch {
        issues.push(`Entry ${index}: Invalid timestamp format`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      entriesChecked: history.length
    };
  }
}

// Export singleton instance
export const matchHistory = new MatchHistory();

// Export utility functions
export const saveMatchToHistory = (matchData, playersData, type) => 
  matchHistory.saveMatchSubmission(matchData, playersData, type);

export const undoLastMatch = (currentPlayersData) => {
  const recent = matchHistory.getRecentSubmissions(1);
  if (recent.length === 0) {
    throw new Error('No recent matches to undo');
  }
  return matchHistory.undoMatch(recent[0].id, currentPlayersData);
};

export const getMatchHistoryStats = () => matchHistory.getStats();