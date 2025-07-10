// Excel export/import utilities
export const exportToExcel = (players) => {
  // Create CSV content that Excel can open
  const headers = ['Player', 'Prev Balance', 'Saturday', 'Sunday', 'Amount Paid', 'Total', 'Status'];
  const csvContent = [
    headers.join(','),
    ...players.map(player => [
      `"${player.name}"`,
      player.prevBalance || 0,
      player.saturday || 0,
      player.sunday || 0,
      player.advPaid || 0,
      player.total || 0,
      `"${player.status || ''}"`
    ].join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `team-cost-tracker-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromExcel = (file, callback) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n');
      
      // Skip header row
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      const players = dataLines.map((line, index) => {
        const values = parseCSVLine(line);
        
        const prevBalance = parseFloat(values[1]) || 0;
        const saturday = parseFloat(values[2]) || 0;
        const sunday = parseFloat(values[3]) || 0;
        const advPaid = parseFloat(values[4]) || 0;
        const total = parseFloat(values[5]) || (prevBalance + saturday + sunday - advPaid);
        const status = values[6] || 'Pending';
        
        // Ensure status is one of the valid values
        const validStatuses = ['Pending', 'Partially Paid', 'Paid'];
        const finalStatus = validStatuses.includes(status) ? status : 'Pending';
        
        return {
          id: `imported_${Date.now()}_${index}`,
          name: values[0] || `Player ${index + 1}`,
          prevBalance: prevBalance,
          saturday: saturday,
          sunday: sunday,
          advPaid: advPaid,
          total: total,
          status: finalStatus
        };
      });
      
      callback(players);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Error reading Excel file. Please check the format and try again.');
    }
  };
  
  reader.readAsText(file);
};

// Helper function to parse CSV line with quoted values
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Enhanced Excel export with better formatting
export const exportToExcelAdvanced = (players) => {
  const currentDate = new Date().toLocaleDateString();
  const totalOutstanding = players.reduce((sum, player) => sum + (player.total || 0), 0);
  const pendingCount = players.filter(player => player.status === 'Pending').length;
  const partiallyPaidCount = players.filter(player => player.status === 'Partially Paid').length;
  const paidCount = players.filter(player => player.status === 'Paid').length;
  
  const content = [
    `Team Cost Tracker - ${currentDate}`,
    '',
    `Total Outstanding: ₹${totalOutstanding}`,
    `Pending: ${pendingCount} | Partially Paid: ${partiallyPaidCount} | Paid: ${paidCount} players`,
    '',
    'Player,Prev Balance,Saturday,Sunday,Amount Paid,Total,Status',
    ...players.map(player => [
      `"${player.name}"`,
      player.prevBalance || 0,
      player.saturday || 0,
      player.sunday || 0,
      player.advPaid || 0,
      player.total || 0,
      `"${player.status || ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `team-cost-tracker-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Create Excel template for easy setup
export const downloadExcelTemplate = () => {
  const template = [
    'Team Cost Tracker Template',
    '',
    'Instructions:',
    '1. Fill in player names in the first column',
    '2. Enter costs for Saturday and Sunday matches',
    '3. Add amount paid if any',
    '4. Mark status as "Paid" when settled',
    '5. Save and import back to the app',
    '',
    'Player,Prev Balance,Saturday,Sunday,Amount Paid,Total,Status',
    'Harjinder,0,0,0,0,0,Pending',
    'Vijay Lal,0,0,0,0,0,Pending',
    'Kamal Karwal,0,0,0,0,0,Pending',
    'Parag,0,0,0,0,0,Pending',
    'Anjeev,0,0,0,0,0,Pending',
    'Vedji,0,0,0,0,0,Pending',
    'Shyam,0,0,0,0,0,Pending',
    'Sagar,0,0,0,0,0,Pending',
    'Nitin Verma,0,0,0,0,0,Pending',
    'Sudhir,0,0,0,0,0,Pending',
    'Baram (Gullu),0,0,0,0,0,Pending',
    'Balle,0,0,0,0,0,Pending',
    'Nikhil,0,0,0,0,0,Pending',
    'Sailesh,0,0,0,0,0,Pending',
    'Gyan,0,0,0,0,0,Pending',
    'Avinash,0,0,0,0,0,Pending',
    'PK,0,0,0,0,0,Pending',
    'Ashish Sikka,0,0,0,0,0,Pending',
    'Dr. Mangal,0,0,0,0,0,Pending',
    'Deepak,0,0,0,0,0,Pending',
    'Bhanu,0,0,0,0,0,Pending',
    'Henam,0,0,0,0,0,Pending',
    'Shantanu,0,0,0,0,0,Pending',
    'Pratap,0,0,0,0,0,Pending',
    'Nitin,0,0,0,0,0,Pending',
    'Aryan,0,0,0,0,0,Pending',
    'Amit Tyagi,0,0,0,0,0,Pending',
    'Sunil Anna,0,0,0,0,0,Pending',
    'Vignesh,0,0,0,0,0,Pending',
    'Chandeep,0,0,0,0,0,Pending'
  ].join('\n');

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'team-cost-tracker-template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};