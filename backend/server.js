const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const events = [
  {
    id: 1,
    userId: 'commuter-001',
    role: 'commuter',
    homeLocation: 'South End',
    workLocation: 'Cambridge',
    preferredMode: 'Transit',
    departureTime: '07:42',
    route: 'Green Line → Red Line',
    predictedDurationMinutes: 28,
    traffic: 'Light traffic',
    weather: 'Clear skies',
    status: 'On time'
  },
  {
    id: 2,
    userId: 'commuter-001',
    role: 'commuter',
    homeLocation: 'South End',
    workLocation: 'Cambridge',
    preferredMode: 'Drive',
    departureTime: '08:05',
    route: 'Via Storrow Drive',
    predictedDurationMinutes: 31,
    traffic: 'Moderate traffic',
    weather: 'Partly cloudy',
    status: 'Good'
  },
  {
    id: 3,
    userId: 'commuter-001',
    role: 'commuter',
    homeLocation: 'South End',
    workLocation: 'Cambridge',
    preferredMode: 'Bike',
    departureTime: '07:55',
    route: 'Charles River path',
    predictedDurationMinutes: 35,
    traffic: 'Clear route',
    weather: 'Mild and sunny',
    status: 'Comfortable'
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/events', (req, res) => {
  res.json(events);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
