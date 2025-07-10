import React, { useRef } from 'react';
import './ExcelWhatsApp.css';

const ExcelWhatsApp = ({ players }) => {
  const canvasRef = useRef(null);

  const generateWhatsAppImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Filter players who played (have non-zero Saturday or Sunday amount)
    const playersWhoPlayed = players.filter(player => 
      (player.saturday || 0) > 0 || (player.sunday || 0) > 0
    );
    
    // Get match dates from the first player who played (they all have the same dates)
    const matchDates = playersWhoPlayed.length > 0 ? playersWhoPlayed[0].matchDates : null;
    
    canvas.width = 600;
    canvas.height = 100 + (playersWhoPlayed.length * 40) + 80; // Dynamic height
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#25d366';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏏 Weekend Cost Update', canvas.width / 2, 50);
    
    // Date
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    if (matchDates) {
      const date1 = new Date(matchDates.saturday).toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric' 
      });
      const date2 = new Date(matchDates.sunday).toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric' 
      });
      ctx.fillText(`Match Dates: ${date1} & ${date2}`, canvas.width / 2, 110);
    } else {
      ctx.fillText(`Updated: ${new Date().toLocaleDateString()}`, canvas.width / 2, 110);
    }
    
    // Table header
    let yPos = 150;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(20, yPos - 30, canvas.width - 40, 35);
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    // Column headers
    const match1Date = matchDates ? new Date(matchDates.saturday).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    }) : 'Match 1';
    const match2Date = matchDates ? new Date(matchDates.sunday).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    }) : 'Match 2';
    
    const columns = [
      { text: 'Player', x: 30 },
      { text: 'Prev', x: 140 },
      { text: match1Date, x: 200 },
      { text: match2Date, x: 250 },
      { text: 'Adv', x: 300 },
      { text: 'Total', x: 350 },
      { text: 'Status', x: 420 }
    ];
    
    columns.forEach(col => {
      ctx.fillText(col.text, col.x, yPos - 10);
    });
    
    // Player rows
    ctx.font = '13px Arial';
    playersWhoPlayed.forEach((player, index) => {
      yPos += 35;
      
      // Alternate row background
      if (index % 2 === 0) {
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(20, yPos - 25, canvas.width - 40, 30);
      }
      
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      
      // Player data
      const rowData = [
        { text: player.name, x: 30 },
        { text: player.prevBalance ? `₹${player.prevBalance}` : '', x: 140 },
        { text: player.saturday ? `₹${player.saturday}` : '', x: 200 },
        { text: player.sunday ? `₹${player.sunday}` : '', x: 250 },
        { text: player.advPaid ? `₹${player.advPaid}` : '', x: 300 },
        { text: player.total ? `₹${player.total}` : '', x: 350 },
        { text: player.status || '', x: 420 }
      ];
      
      rowData.forEach((data, colIndex) => {
        if (colIndex === 5) { // Total column
          ctx.fillStyle = '#007bff';
          ctx.font = 'bold 13px Arial';
        } else if (colIndex === 6) { // Status column
          if (data.text === 'Paid') {
            ctx.fillStyle = '#28a745';
          } else if (data.text === 'Partially Paid') {
            ctx.fillStyle = '#fd7e14';
          } else if (data.text === 'Pending') {
            ctx.fillStyle = '#dc3545';
          } else {
            ctx.fillStyle = '#333333';
          }
          ctx.font = 'bold 13px Arial';
        } else {
          ctx.fillStyle = '#333333';
          ctx.font = '13px Arial';
        }
        
        ctx.fillText(data.text, data.x, yPos - 5);
      });
    });
    
    // Summary
    yPos += 50;
    const pendingPlayers = playersWhoPlayed.filter(player => player.status === 'Pending');
    const partiallyPaidPlayers = playersWhoPlayed.filter(player => player.status === 'Partially Paid');
    const paidPlayers = playersWhoPlayed.filter(player => player.status === 'Paid');
    
    ctx.fillStyle = '#dc3545';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Pending: ${pendingPlayers.length}`, canvas.width / 2 - 120, yPos);
    
    ctx.fillStyle = '#fd7e14';
    ctx.fillText(`Partial: ${partiallyPaidPlayers.length}`, canvas.width / 2, yPos);
    
    ctx.fillStyle = '#28a745';
    ctx.fillText(`Paid: ${paidPlayers.length}`, canvas.width / 2 + 120, yPos);
    
    // Download
    const link = document.createElement('a');
    link.download = `team-cost-update-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getPlayersWhoPlayed = () => {
    return players.filter(player => 
      (player.saturday || 0) > 0 || (player.sunday || 0) > 0
    );
  };

  const getTotalAmount = () => {
    return getPlayersWhoPlayed().reduce((sum, player) => sum + (player.total || 0), 0);
  };

  const getPendingCount = () => {
    return getPlayersWhoPlayed().filter(player => player.status === 'Pending').length;
  };

  const getPartiallyPaidCount = () => {
    return getPlayersWhoPlayed().filter(player => player.status === 'Partially Paid').length;
  };

  const getPaidCount = () => {
    return getPlayersWhoPlayed().filter(player => player.status === 'Paid').length;
  };

  return (
    <div className="excel-whatsapp">
      <div className="generator-header">
        <h3>📱 WhatsApp Summary Generator</h3>
        <div className="quick-summary">
          <span>Total: ₹{getTotalAmount()}</span>
          <span>Pending: {getPendingCount()}</span>
          <span>Partial: {getPartiallyPaidCount()}</span>
          <span>Paid: {getPaidCount()}</span>
        </div>
      </div>
      
      <button 
        className="generate-btn"
        onClick={generateWhatsAppImage}
        disabled={getPlayersWhoPlayed().length === 0}
      >
        📸 Generate WhatsApp Image
      </button>
      
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ExcelWhatsApp;