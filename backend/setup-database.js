const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const databasePath = path.join(__dirname, 'data.db');
const database = new sqlite3.Database(databasePath);

const exampleRows = [
  [1, 'commuter-001', 'commuter', 'encrypted-login-001', 'South End', 'Cambridge', 'Transit', '08:30', 'Green Line -> Red Line', '2026-09-01', 28, 'Light traffic', 'Clear skies', '07:42', 'Green Line -> Red Line', 28, 'On time', null],
  [2, 'commuter-001', 'commuter', 'encrypted-login-001', 'South End', 'Cambridge', 'Drive', '08:30', 'Via Storrow Drive', '2026-09-02', 31, 'Moderate traffic', 'Partly cloudy', '08:05', 'Via Storrow Drive', 31, 'Good', null],
  [3, 'commuter-001', 'commuter', 'encrypted-login-001', 'South End', 'Cambridge', 'Bike', '08:30', 'Charles River path', '2026-09-03', 35, 'Clear route', 'Mild and sunny', '07:55', 'Charles River path', 35, 'Comfortable', null]
];

database.serialize(() => {
  database.run(`
    CREATE TABLE IF NOT EXISTS commute_records (
      id INTEGER PRIMARY KEY,
      user_profile TEXT NOT NULL,
      role TEXT NOT NULL,
      encrypted_login_details TEXT NOT NULL,
      home_location TEXT,
      work_location TEXT,
      preferred_travel_mode TEXT,
      preferred_arrival_time TEXT,
      saved_route TEXT,
      historical_trip_date TEXT,
      historical_trip_duration_minutes INTEGER,
      traffic_snapshot TEXT,
      weather_snapshot TEXT,
      predicted_departure_time TEXT,
      predicted_route TEXT,
      predicted_duration_minutes INTEGER,
      prediction_status TEXT,
      admin_activity TEXT
    )
  `);

  database.run('DELETE FROM commute_records');

  const insert = database.prepare(`
    INSERT INTO commute_records (
      id, user_profile, role, encrypted_login_details, home_location,
      work_location, preferred_travel_mode, preferred_arrival_time,
      saved_route, historical_trip_date, historical_trip_duration_minutes,
      traffic_snapshot, weather_snapshot, predicted_departure_time,
      predicted_route, predicted_duration_minutes, prediction_status,
      admin_activity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of exampleRows) {
    insert.run(row);
  }

  insert.finalize((error) => {
    if (error) {
      console.error('Failed to insert example rows:', error.message);
      database.close();
      process.exitCode = 1;
      return;
    }

    console.log(`Database ready at ${databasePath}`);
    console.log(`Inserted ${exampleRows.length} example rows into commute_records.`);
    database.close();
  });
});