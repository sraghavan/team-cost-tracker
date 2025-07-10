import React, { useState, useRef, useEffect } from 'react';
import { exportToExcelAdvanced, importFromExcel, downloadExcelTemplate } from '../utils/excelUtils';
import './CacheManager.css';

const CacheManager = ({ 
  players, 
  saveStatus, 
  lastSaved, 
  onClearCache, 
  onRestoreBackup, 
  onImportPlayers,
  getCacheInfo 
}) => {
  const [showManager, setShowManager] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cacheManagerRef = useRef(null);

  const handleExcelExport = () => {
    exportToExcelAdvanced(players);
  };

  const handleExcelImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      importFromExcel(file, (importedPlayers) => {
        if (window.confirm(`Import ${importedPlayers.length} players? This will replace current data.`)) {
          onImportPlayers(importedPlayers);
          setImportFile(null);
        }
      });
    }
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all cached data? This cannot be undone.')) {
      onClearCache();
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('⚠️ Clear ALL data including match history? This will:\n\n• Delete all player data\n• Clear match history\n• Remove all cached information\n\nThis cannot be undone!')) {
      // Clear match history explicitly
      localStorage.removeItem('matchHistory');
      onClearCache();
      alert('All data cleared successfully!');
    }
  };

  const handleRestoreBackup = () => {
    const backupTimestamp = onRestoreBackup();
    if (backupTimestamp) {
      alert(`Restored from backup created at ${new Date(backupTimestamp).toLocaleString()}`);
    } else {
      alert('No backup found');
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved || lastSaved === 'never') return 'Ready to save';
    if (typeof lastSaved === 'string') return lastSaved;
    
    const now = new Date();
    const savedDate = new Date(lastSaved);
    const diff = now - savedDate;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return savedDate.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (!saveStatus || saveStatus === 'idle') return '#17a2b8';
    switch (saveStatus) {
      case 'saved': return '#28a745';
      case 'saving': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#17a2b8';
    }
  };

  const getStatusText = () => {
    if (!saveStatus || saveStatus === 'idle') return 'Ready';
    switch (saveStatus) {
      case 'saved': return 'Saved';
      case 'saving': return 'Saving...';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const cacheInfo = getCacheInfo();

  const handleMouseDown = (e) => {
    if (e.target.closest('.manager-toggle')) return; // Don't drag when clicking the toggle button
    setIsDragging(true);
    const rect = cacheManagerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 50;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={cacheManagerRef}
      className={`cache-manager ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="save-status">
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className="status-text">
          {getStatusText()} • {formatLastSaved()}
        </span>
        <button 
          className="manager-toggle"
          onClick={() => setShowManager(!showManager)}
          title="Cache & Export Options"
        >
          ⚙️
        </button>
      </div>

      {showManager && (
        <div className="manager-panel">
          <h4>Data Management</h4>
          
          <div className="manager-section">
            <h5>📊 Excel Export/Import</h5>
            <div className="button-group">
              <button onClick={handleExcelExport} className="export-excel-btn">
                📤 Export to Excel
              </button>
              <label className="import-excel-btn">
                📥 Import from Excel
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleExcelImport}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={handleDownloadTemplate} className="template-btn">
                📋 Download Template
              </button>
            </div>
          </div>

          <div className="manager-section">
            <h5>💾 Cache Management</h5>
            <div className="cache-info">
              <div>Cache Size: {Math.round(cacheInfo.cacheSize / 1024)}KB</div>
              <div>Last Backup: {cacheInfo.backupTimestamp ? 
                new Date(cacheInfo.backupTimestamp).toLocaleString() : 'None'}</div>
              <div>Players: {players.length}</div>
              <div>Database: {cacheInfo.usingDatabase ? '🟢 Connected' : '🔴 Offline Mode'}</div>
              {cacheInfo.syncPending && <div>🔄 Sync Pending</div>}
              <div>Network: {cacheInfo.isOnline ? '🟢 Online' : '🔴 Offline'}</div>
            </div>
            <div className="button-group">
              <button onClick={handleRestoreBackup} className="restore-btn">
                🔄 Restore Backup
              </button>
              <button onClick={handleClearCache} className="clear-btn">
                🗑️ Clear Cache
              </button>
              <button onClick={handleClearAllData} className="clear-all-btn">
                🚨 Clear All Data
              </button>
            </div>
          </div>

          <div className="manager-section">
            <h5>💡 Tips</h5>
            <ul className="tips-list">
              <li>Data auto-saves every 2 seconds</li>
              <li>Auto-backup every 5 minutes</li>
              <li>Export to Excel for offline editing</li>
              <li>Import Excel files to restore data</li>
              <li>Cache survives browser refresh</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheManager;