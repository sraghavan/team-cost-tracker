import React, { useRef, useState } from 'react';
import { calculatePlayerBalance } from '../utils/dataStructure';
import './WhatsAppGenerator.css';

const WhatsAppGenerator = ({ players, matches, payments }) => {
  const canvasRef = useRef(null);
  const [showOption, setShowOption] = useState('all'); // 'all' or 'pending'

  const generateWhatsAppImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 600;
    canvas.height = 800;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#25d366';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ Team Cost Summary', canvas.width / 2, 50);
    
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

    const playersWithBalances = players.map(player => ({
      ...player,
      balance: calculatePlayerBalance(player, matches, payments)
    }));

    let yPosition = 120;
    
    ctx.fillStyle = '#333333';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`, 30, yPosition);
    yPosition += 40;
    
    if (currentWeekMatches.length > 0) {
      ctx.fillStyle = '#007bff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('This Week\'s Matches:', 30, yPosition);
      yPosition += 30;
      
      currentWeekMatches.forEach(match => {
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.fillText(`${new Date(match.date).toLocaleDateString()}: ${match.team1} vs ${match.team2}`, 50, yPosition);
        yPosition += 25;
        
        const total = match.expenses.ground + match.expenses.cafeteria;
        ctx.fillText(`Ground: ₹${match.expenses.ground} | Cafeteria: ₹${match.expenses.cafeteria} | Total: ₹${total}`, 50, yPosition);
        yPosition += 25;
        
        ctx.fillText(`Split among ${match.participants.length} players: ₹${(total / match.participants.length).toFixed(2)} each`, 50, yPosition);
        yPosition += 35;
      });
      
      ctx.fillStyle = '#007bff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Total This Week: ₹${totalCurrentWeekExpenses.toFixed(2)}`, 30, yPosition);
      yPosition += 50;
    }
    
    ctx.fillStyle = '#dc3545';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('💰 Payment Status:', 30, yPosition);
    yPosition += 40;
    
    const pendingPlayers = playersWithBalances.filter(player => player.balance < 0);
    const advancePlayers = playersWithBalances.filter(player => player.balance > 0);
    const settledPlayers = playersWithBalances.filter(player => player.balance === 0);
    
    if (showOption === 'pending') {
      // Show only pending payments
      if (pendingPlayers.length > 0) {
        ctx.fillStyle = '#dc3545';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('❌ Pending Payments:', 30, yPosition);
        yPosition += 30;
        
        pendingPlayers.forEach(player => {
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.fillText(`${player.name}: ₹${Math.abs(player.balance).toFixed(2)}`, 50, yPosition);
          yPosition += 25;
        });
      } else {
        ctx.fillStyle = '#28a745';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('🎉 All payments are settled!', 30, yPosition);
        yPosition += 30;
      }
    } else {
      // Show all players (existing behavior)
      if (pendingPlayers.length > 0) {
        ctx.fillStyle = '#dc3545';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('❌ Pending Payments:', 30, yPosition);
        yPosition += 30;
        
        pendingPlayers.forEach(player => {
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.fillText(`${player.name}: ₹${Math.abs(player.balance).toFixed(2)}`, 50, yPosition);
          yPosition += 25;
        });
        yPosition += 20;
      }
      
      if (advancePlayers.length > 0) {
        ctx.fillStyle = '#28a745';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('✅ Advance Payments:', 30, yPosition);
        yPosition += 30;
        
        advancePlayers.forEach(player => {
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.fillText(`${player.name}: +₹${player.balance.toFixed(2)}`, 50, yPosition);
          yPosition += 25;
        });
        yPosition += 20;
      }
      
      if (settledPlayers.length > 0) {
        ctx.fillStyle = '#17a2b8';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('✅ Settled:', 30, yPosition);
        yPosition += 30;
        
        settledPlayers.forEach(player => {
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.fillText(`${player.name}: Settled`, 50, yPosition);
          yPosition += 25;
        });
      }
    }
    
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by Team Cost Splitter', canvas.width / 2, canvas.height - 20);
    
    const link = document.createElement('a');
    const suffix = showOption === 'pending' ? 'pending' : 'all';
    link.download = `team-cost-summary-${suffix}-${weekStart.toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="whatsapp-generator">
      <div className="generator-header">
        <h3>📱 WhatsApp Summary Generator</h3>
        <p>Generate an image summary to share with your team</p>
      </div>
      
      <div className="generator-options">
        <div className="option-group">
          <label>Choose what to include:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input 
                type="radio" 
                value="all" 
                checked={showOption === 'all'}
                onChange={(e) => setShowOption(e.target.value)}
              />
              <span>All Players (Pending + Paid + Advance)</span>
            </label>
            <label className="radio-option">
              <input 
                type="radio" 
                value="pending" 
                checked={showOption === 'pending'}
                onChange={(e) => setShowOption(e.target.value)}
              />
              <span>Pending Payments Only</span>
            </label>
          </div>
        </div>
      </div>
      
      <button 
        className="generate-btn"
        onClick={generateWhatsAppImage}
      >
        📸 Generate WhatsApp Image ({showOption === 'all' ? 'All Players' : 'Pending Only'})
      </button>
      
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default WhatsAppGenerator;