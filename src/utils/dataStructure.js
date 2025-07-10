export const createMatch = (date, team1, team2) => ({
  id: Date.now().toString(),
  date,
  team1,
  team2,
  expenses: {
    ground: 0,
    cafeteria: 0
  },
  paidBy: {
    ground: null,
    cafeteria: null
  },
  participants: []
});

export const createPlayer = (name, phone = '') => ({
  id: Date.now().toString() + Math.random(),
  name,
  phone,
  balance: 0,
  payments: []
});

export const createPayment = (playerId, amount, matchId, type = 'payment', description = '') => ({
  id: Date.now().toString() + Math.random(),
  playerId,
  amount,
  matchId,
  type,
  description,
  date: new Date().toISOString()
});

export const calculatePlayerBalance = (player, matches, payments) => {
  let balance = 0;
  
  matches.forEach(match => {
    if (match.participants.includes(player.id)) {
      const totalExpense = match.expenses.ground + match.expenses.cafeteria;
      const perPersonCost = totalExpense / match.participants.length;
      balance -= perPersonCost;
    }
    
    if (match.paidBy.ground === player.id) {
      balance += match.expenses.ground;
    }
    if (match.paidBy.cafeteria === player.id) {
      balance += match.expenses.cafeteria;
    }
  });
  
  const playerPayments = payments.filter(p => p.playerId === player.id);
  playerPayments.forEach(payment => {
    if (payment.type === 'payment') {
      balance += payment.amount;
    } else if (payment.type === 'advance') {
      balance += payment.amount;
    }
  });
  
  return balance;
};

export const getWeeklyExpenses = (matches, startDate, endDate) => {
  return matches.filter(match => {
    const matchDate = new Date(match.date);
    return matchDate >= startDate && matchDate <= endDate;
  });
};