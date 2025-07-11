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

    // Calculate what player data should be without this specific match
    const correctedPlayersData = this.calculatePlayersWithoutMatch(currentPlayersData, match);

    return {
      restoredPlayersData: correctedPlayersData,
      matchInfo: match
    };
  }

  // Calculate player data by removing a specific match's impact
  calculatePlayersWithoutMatch(currentPlayersData, matchToRemove) {
    return currentPlayersData.map(currentPlayer => {
      // Find this player in the match being removed
      const playerInMatch = matchToRemove.playersData.find(p => 
        p.id === currentPlayer.id || p.name === currentPlayer.name
      );

      if (!playerInMatch) {
        // Player wasn't in the match being removed, keep current state
        return currentPlayer;
      }

      // Calculate what the player's state should be without this match
      const saturdayToRemove = playerInMatch.saturday || 0;
      const sundayToRemove = playerInMatch.sunday || 0;
      const totalMatchCost = saturdayToRemove + sundayToRemove;

      // Remove the match costs from current amounts
      const newSaturday = Math.max(0, (currentPlayer.saturday || 0) - saturdayToRemove);
      const newSunday = Math.max(0, (currentPlayer.sunday || 0) - sundayToRemove);

      // Recalculate total: prevBalance + saturday + sunday - advPaid
      const newTotal = (currentPlayer.prevBalance || 0) + newSaturday + newSunday - (currentPlayer.advPaid || 0);
      
      // Determine new status
      const hasPlayedAfterRemoval = newSaturday > 0 || newSunday > 0;
      const newStatus = this.calculatePlayerStatus(newTotal, hasPlayedAfterRemoval);

      return {
        ...currentPlayer,
        saturday: newSaturday,
        sunday: newSunday,
        total: newTotal,
        status: newStatus,
        // Clear match dates if player no longer played
        matchDates: hasPlayedAfterRemoval ? currentPlayer.matchDates : undefined
      };
    });
  }

  // Calculate appropriate status based on total and playing status
  calculatePlayerStatus(total, hasPlayed) {
    if (!hasPlayed) return '';
    if (total <= 0) return 'Paid';
    if (total > 0) return 'Pending';
    return '';
  }

  // Undo multiple matches in sequence (most recent first)
  undoLastNMatches(n, currentPlayersData) {
    const recentMatches = this.getRecentSubmissions(30)
      .filter(match => match.submissionType !== 'undo_backup')
      .slice(0, n);

    if (recentMatches.length === 0) {
      throw new Error('No matches to undo');
    }

    // Create backup of current state
    this.saveMatchSubmission(
      { action: 'bulk_undo_preparation', matchCount: recentMatches.length },
      currentPlayersData,
      'undo_backup'
    );

    // Apply undo for each match in reverse chronological order
    let workingPlayersData = currentPlayersData;
    const undoneMatches = [];

    for (const match of recentMatches) {
      workingPlayersData = this.calculatePlayersWithoutMatch(workingPlayersData, match);
      undoneMatches.push(match);
      
      // Remove from history
      this.deleteMatch(match.id);
    }

    return {
      restoredPlayersData: workingPlayersData,
      undoneMatches,
      undoCount: undoneMatches.length
    };
  }

  // Rebuild player state from scratch based on history (nuclear option)
  rebuildPlayerStateFromHistory(basePlayersData, excludeMatchIds = []) {
    const history = this.getHistory()
      .filter(entry => 
        entry.submissionType === 'weekend' && 
        !excludeMatchIds.includes(entry.id)
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Oldest first

    // Start with base player data (usually with only prevBalance)
    let rebuiltPlayers = basePlayersData.map(player => ({
      ...player,
      saturday: 0,
      sunday: 0,
      total: player.prevBalance || 0,
      status: '',
      matchDates: undefined
    }));

    // Apply each historical match in chronological order
    for (const match of history) {
      rebuiltPlayers = this.applyMatchToPlayers(rebuiltPlayers, match);
    }

    return rebuiltPlayers;
  }

  // Apply a historical match to current player data
  applyMatchToPlayers(currentPlayers, historicalMatch) {
    return currentPlayers.map(currentPlayer => {
      const playerInMatch = historicalMatch.playersData.find(p => 
        p.id === currentPlayer.id || p.name === currentPlayer.name
      );

      if (!playerInMatch) {
        return currentPlayer; // Player wasn't in this match
      }

      const addedSaturday = playerInMatch.saturday || 0;
      const addedSunday = playerInMatch.sunday || 0;
      const newSaturday = (currentPlayer.saturday || 0) + addedSaturday;
      const newSunday = (currentPlayer.sunday || 0) + addedSunday;
      
      // Recalculate total
      const newTotal = (currentPlayer.prevBalance || 0) + newSaturday + newSunday - (currentPlayer.advPaid || 0);
      
      // Update status
      const hasPlayed = newSaturday > 0 || newSunday > 0;
      const newStatus = this.calculatePlayerStatus(newTotal, hasPlayed);

      return {
        ...currentPlayer,
        saturday: newSaturday,
        sunday: newSunday,
        total: newTotal,
        status: newStatus,
        matchDates: hasPlayed ? historicalMatch.matchData?.matchDates : currentPlayer.matchDates
      };
    });
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

// Validation function to ensure totals are correctly calculated
export const validatePlayerTotals = (players) => {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    playerChecks: []
  };

  players.forEach(player => {
    const expectedTotal = (player.prevBalance || 0) + 
                         (player.saturday || 0) + 
                         (player.sunday || 0) - 
                         (player.advPaid || 0);
    
    const actualTotal = player.total || 0;
    const discrepancy = Math.abs(expectedTotal - actualTotal);
    
    const playerCheck = {
      name: player.name,
      expectedTotal,
      actualTotal,
      discrepancy,
      isCorrect: discrepancy < 0.01 // Allow for floating point precision
    };
    
    if (!playerCheck.isCorrect) {
      validationResults.isValid = false;
      validationResults.errors.push(
        `${player.name}: Expected ₹${expectedTotal}, got ₹${actualTotal} (difference: ₹${discrepancy.toFixed(2)})`
      );
    }
    
    // Check status consistency
    const hasPlayed = (player.saturday || 0) > 0 || (player.sunday || 0) > 0;
    if (hasPlayed && !player.status) {
      validationResults.warnings.push(`${player.name}: Played but has no status`);
    }
    
    if (!hasPlayed && player.status && player.status !== '') {
      validationResults.warnings.push(`${player.name}: Has status but didn't play`);
    }
    
    validationResults.playerChecks.push(playerCheck);
  });
  
  return validationResults;
};

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

// Export advanced functions for testing
export const undoMultipleMatches = (count, currentPlayersData) => 
  matchHistory.undoLastNMatches(count, currentPlayersData);

export const rebuildFromHistory = (basePlayersData, excludeIds = []) =>
  matchHistory.rebuildPlayerStateFromHistory(basePlayersData, excludeIds);

export const calculateWithoutMatch = (currentPlayersData, matchId) => {
  const match = matchHistory.getMatch(matchId);
  if (!match) throw new Error('Match not found');
  return matchHistory.calculatePlayersWithoutMatch(currentPlayersData, match);
};