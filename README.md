# 🏏 Team Cost Tracker

A React application for splitting cricket match costs among team members.

## Features

- **Match Cost Management**: Track costs for multiple matches with separate ground and cafeteria expenses
- **Team Selection**: Support for MICC, SADHOOZ, and other teams with team-specific regular players
- **Player Management**: Add players, track participation, and manage payments
- **Automatic Calculations**: Split costs equally among selected players with automatic balance calculations
- **Status Tracking**: Automatic status updates (Pending/Paid) based on payment balance
- **Match History**: Store and restore previous match details
- **Calendar Integration**: Track specific match dates for better record keeping
- **WhatsApp Integration**: Generate shareable match summary images
- **Excel Export/Import**: Backup and restore data via CSV/Excel files
- **Auto-save**: Automatic data persistence with backup functionality

## Tech Stack

- **Frontend**: React with hooks
- **Storage**: LocalStorage with auto-save
- **Styling**: CSS Grid and Flexbox
- **Export**: Canvas API for image generation, CSV for Excel compatibility

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

1. **Select Match Dates**: Use calendar pickers for each match
2. **Choose Teams**: Select team for each match (MICC/SADHOOZ/OTHER)
3. **Enter Costs**: Add ground and cafeteria costs per match
4. **Select Players**: Choose who played each match from team-specific lists
5. **Apply Costs**: Split costs automatically among selected players
6. **Track Payments**: Monitor status and balances
7. **Generate Reports**: Create WhatsApp-ready summary images

## Match History

- Automatically saves each match session
- Preview previous matches with full details
- Restore previous match settings and player amounts
- Supports up to 20 historical entries

## Data Management

- **Auto-save**: Every 2 seconds
- **Auto-backup**: Every 5 minutes
- **Excel Export**: Full data export with formatting
- **Excel Import**: Restore from CSV/Excel files
- **Cache Management**: Clear data and history as needed

## Default Teams

### MICC Regular Players
- Kamal Karwal, Anjeev, Sailesh, Nikhil, Shyam, Sagar, Parag, Sudhir, Baram (Gullu), Ashish Sikka, Bhanu, Shantanu, Sunil Anna, Avinash

### SADHOOZ Regular Players  
- Kamal Karwal, Anjeev, Sailesh, Nikhil, Shyam, PK, Amit Tyagi, Sudhir, Baram (Gullu), Harjinder, Vijay Lal, Aryan, Sunil Anna, Avinash

## Contributing

This is a personal project for team cost management. Feel free to fork and adapt for your own team needs.

## License

MIT License - feel free to use and modify for your teams!