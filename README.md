# Flight Results Page

A modern flight search and booking platform with real-time pricing, filtering, and agent tools.

## Core Features

### Search & Results
- Real-time flight search with progressive loading
- Price calendar with dynamic updates
- Advanced filtering system (stops, times, airlines)
- Smart sorting (best, cheapest, fastest)
- Round-trip and one-way support

### Agent Tools
- WhatsApp integration for bookings
- Flight details copying
- Commission management
- Route tracking

### Admin Features
- Search monitoring
- Agent management
- System controls
- Dynamic scoring configuration

## Module Overview

### Core Search
- Location selection with autocomplete
- Date picker with price calendar
- Passenger management
- Trip type selection

### Results Display
- Progressive loading
- Detailed flight cards
- Interactive modals
- Price breakdown

### Filtering System
- Stop count filtering
- Time range selection
- Airline filtering
- Price range filtering

### Sorting Module
- Best (custom scoring)
- Cheapest (price-based)
- Fastest (duration-based)

### Admin Panel
- Search monitoring
- User management
- System settings
- Route tracking

### Authentication
- Role-based access
- Session management
- Agent verification

### Database Integration
- Price caching
- Search history
- User data management

### Agent Tools
- Commission tracking
- Booking tools
- Route analysis

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## License

MIT License - see LICENSE file for details