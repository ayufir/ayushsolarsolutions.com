# Solar Panel Company - Employee Tracking Application

A complete MERN stack application with real-time location tracking using Socket.IO and Leaflet Maps.

## Tech Stack
- **Database:** MongoDB
- **Backend:** Node.js, Express.js, Socket.IO
- **Frontend:** React, Vite, Tailwind CSS, React-Leaflet
- **Maps:** Leaflet with OpenStreetMap

## Folder Structure
- `/backend` - Express API, Mongoose Models, Socket.IO server.
- `/frontend` - React Application (Admin Dashboard & Employee Mobile Tracking App).

## Prerequisites
- Node.js installed
- MongoDB installed and running (or a MongoDB Atlas URI)

## Setup Instructions

### 1. Backend Setup
1. Open terminal and navigate to `/backend` directory.
2. Run `npm install` to install dependencies.
3. Verify the `.env` file has the correct `MONGO_URI` (default is `mongodb://localhost:27017/employee-tracking`).
4. Start the server:
   ```bash
   node server.js
   ```
   *Note: On first run, a default admin is seeded: `admin@solarcompany.com` / `admin123`.*

### 2. Frontend Setup
1. Open another terminal and navigate to `/frontend` directory.
2. Run `npm install` to install dependencies.
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser:
   - Admin Login: `http://localhost:5173/admin/login`
   - Employee Login: `http://localhost:5173/employee/login`

## Usage
- **Admin Dashboard:** Log in with the admin credentials. Add employees in the "Employees" tab.
- **Employee App:** Open the employee login URL on a mobile device (or simulate in browser). Log in using credentials created by Admin. Click "Start Tracking" and allow location permissions. The admin will immediately see the marker appear and update on the map.
