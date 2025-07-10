export const defaultPlayerNames = [
  'Harjinder',
  'Vijay Lal',
  'Kamal Karwal',
  'Parag',
  'Anjeev',
  'Vedji',
  'Shyam',
  'Sagar',
  'Nitin Verma',
  'Sudhir',
  'Baram (Gullu)',
  'Balle',
  'Nikhil',
  'Sailesh',
  'Gyan',
  'Avinash',
  'PK',
  'Ashish Sikka',
  'Dr. Mangal',
  'Deepak',
  'Bhanu',
  'Henam',
  'Shantanu',
  'Pratap',
  'Nitin',
  'Aryan',
  'Amit Tyagi',
  'Sunil Anna',
  'Vignesh',
  'Chandeep'
];

export const createDefaultPlayers = () => {
  return defaultPlayerNames.map((name, index) => ({
    id: `default_${index}_${Date.now()}`,
    name: name,
    prevBalance: 0,
    saturday: 0,
    sunday: 0,
    advPaid: 0,
    total: 0,
    status: ''
  }));
};

export const initializePlayersIfEmpty = (currentPlayers) => {
  if (currentPlayers.length === 0) {
    return createDefaultPlayers();
  }
  return currentPlayers;
};