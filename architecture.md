What

AI Personalized Commute Predictor is a web app that predicts a user’s best travel time, route, and expected journey duration using their preferences, past trips, traffic, and weather.

We Are Building

Two logins: Commuter Login for people receiving personalized predictions, and Admin Login for managing users, commute data, and prediction quality.

The Four Parts and Each One Does in This Project

Frontend: Screens for login, commute preferences, predictions, and trip history.

Backend: Processes requests, applies prediction logic, and connects services.

Database: Securely stores users, routes, preferences, trip records, and predictions.

AI/External Data Service: Learns travel patterns and combines traffic, weather, and map data.

The Folder Structure as a Tree

commute-predictor/
├── frontend/
├── backend/
├── database/
├── ai-service/
├── documentation/
└── tests/

The Data We Need to Store

User profile and role; encrypted login details; home/work locations; preferred travel modes and arrival times; saved routes; historical trips; traffic/weather snapshots; generated predictions; and admin activity records.

What We Build First

First, build secure Commuter and Admin login, roles, and basic user profiles. Next add preference entry and data storage, then show simple commute estimates before adding AI personalization and live data.