import React, { useState } from 'react';
import ExcelTable from './components/ExcelTable';
import WeekendForm from './components/WeekendForm';
import ExcelWhatsApp from './components/ExcelWhatsApp';
import CacheManager from './components/CacheManager';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SettingsTab from './components/SettingsTab';
import UpdateNotification from './components/UpdateNotification';
import { useDatabase } from './hooks/useDatabase';
import './App.css';

function App() {
  const {
    data: players,
    updateData: setPlayers,
    saveStatus,
    lastSaved,
    clearCache,
    restoreFromBackup,
    getCacheInfo,
    isOnline,
    syncPending
  } = useDatabase([]);

  const [activeTab, setActiveTab] = useState('tracker');

  const handleReminderSettingsChange = (settings) => {
    // Send message to service worker to schedule reminders
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        settings
      });
    }
  };

  const addPlayer = (player) => {
    setPlayers([...players, player]);
  };

  const removePlayer = (playerId) => {
    if (window.confirm('Are you sure you want to remove this player?')) {
      setPlayers(players.filter(player => player.id !== playerId));
    }
  };

  const updatePlayer = (updatedPlayer) => {
    setPlayers(players.map(player => 
      player.id === updatedPlayer.id ? updatedPlayer : player
    ));
  };

  const updateAllPlayers = (updatedPlayers) => {
    setPlayers(updatedPlayers);
  };

  const handleImportPlayers = (importedPlayers) => {
    setPlayers(importedPlayers);
  };

  const handleExport = () => {
    const data = {
      players,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `team-cost-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.players) {
            setPlayers(data.players);
            alert('Data imported successfully!');
          } else {
            alert('Invalid data format');
          }
        } catch (error) {
          alert('Error reading file: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tracker':
        return (
          <div>
            <WeekendForm players={players} onUpdatePlayers={updateAllPlayers} onAddPlayer={addPlayer} onRemovePlayer={removePlayer} />
            <ExcelTable 
              players={players} 
              onAddPlayer={addPlayer} 
              onRemovePlayer={removePlayer}
              onUpdatePlayer={updatePlayer}
              onUpdatePlayers={updateAllPlayers}
            />
            <ExcelWhatsApp players={players} />
          </div>
        );
      case 'settings':
        return (
          <SettingsTab 
            players={players} 
            onReminderSettingsChange={handleReminderSettingsChange}
          />
        );
      default:
        return (
          <div>
            <WeekendForm players={players} onUpdatePlayers={updateAllPlayers} onAddPlayer={addPlayer} />
            <ExcelTable 
              players={players} 
              onAddPlayer={addPlayer} 
              onRemovePlayer={removePlayer}
              onUpdatePlayer={updatePlayer}
              onUpdatePlayers={updateAllPlayers}
            />
            <ExcelWhatsApp players={players} />
          </div>
        );
    }
  };

  return (
    <div className="App">
      <CacheManager 
        players={players}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        onClearCache={clearCache}
        onRestoreBackup={restoreFromBackup}
        onImportPlayers={handleImportPlayers}
        getCacheInfo={getCacheInfo}
      />
      
      <PWAInstallPrompt />
      <UpdateNotification />
      
      <header className="App-header">
        <h1>🏏 Team Cost Tracker</h1>
        
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            📊 Tracker
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>
        
        <div className="data-controls">
          <button onClick={handleExport} className="export-btn">📤 Export JSON</button>
          <label className="import-btn">
            📥 Import JSON
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      <main className="App-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;