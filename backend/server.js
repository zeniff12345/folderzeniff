const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(cors());

const database = new sqlite3.Database(path.join(__dirname, 'data.db'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/events', (req, res) => {
  database.all('SELECT * FROM commute_records ORDER BY id', (error, rows) => {
    if (error) {
      res.status(500).json({ error: 'Failed to load commute events' });
      return;
    }

    res.json(rows.map((row) => ({
      id: row.id,
      userId: row.user_profile,
      role: row.role,
      homeLocation: row.home_location,
      workLocation: row.work_location,
      preferredMode: row.preferred_travel_mode,
      departureTime: row.predicted_departure_time,
      route: row.predicted_route,
      predictedDurationMinutes: row.predicted_duration_minutes,
      traffic: row.traffic_snapshot,
      weather: row.weather_snapshot,
      status: row.prediction_status
    })));
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
