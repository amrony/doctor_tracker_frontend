# Doctor Tracker

Doctor Tracker is a web-based clinic management application that helps administrators manage doctors and their patients. It provides a simple dashboard to view clinic information, search records, and manage doctor and patient details. Administrators can securely log in and add, update, view, or delete records.

## Live Deployment

- Frontend: [Doctor Tracker](https://doctortrackerfrontend-kappa.vercel.app)
- Backend health: [API health check](https://doctor-tracker-api-50im.onrender.com/api/health)
- Frontend repository: [doctor_tracker_frontend](https://github.com/amrony/doctor_tracker_frontend)
- Backend repository: [doctor_tracker_backend](https://github.com/amrony/doctor_tracker_backend)

## Screenshots

### Dashboard

Desktop | Mobile 
----------------------
[Dashboard Desktop](docs/screenshots/dashboard-desktop.png) 
[Dashboard Mobile](docs/screenshots/dashboard-mobile.png) 

### Sign In

Desktop | Mobile
----------------------
[Sign In Desktop](docs/screenshots/sign-in-desktop.png)
[Sign In Mobile](docs/screenshots/sign-in-mobile.png) 


## Technologies Used
----------------------
Frontend:
- Next.js 16
- React 19
- TypeScript

Backend:
- Node.js 22
- Express 5

Database:
- MongoDB
- Mongoose

Authentication:
- Secure administrator login
- HttpOnly session cookies

## Features

- Secure administrator sign-in and protected workspace
- Dashboard with doctor and patient totals
- Patient activity chart for the last 7, 30, or 90 days
- Patient counts by doctor
- Add and browse doctors
- Search doctors by name, specialization, or hospital
- Filter the doctor directory by specialization, hospital, and date
- View a doctor's profile and associated patients
- Add and remove patients from a doctor's list
- Browse, search, and filter all patients by doctor, condition, and date
- Edit and delete patient records
- Pagination for doctor and patient directories
- Responsive desktop and mobile layouts

## Requirements

Before running the project, make sure you have:

- Node.js 22.13 or later
- npm
- MongoDB (local or cloud database)

## Installation and Setup

The project contains two separate folders for the frontend and backend.

### 1. Clone the Repository

Clone both repositories into a shared workspace folder:

```bash
mkdir doctor-tracker
cd doctor-tracker
git clone https://github.com/amrony/doctor_tracker_backend.git doctor_tracker_backend
git clone https://github.com/amrony/doctor_tracker_frontend.git doctor_tracker_frontend
```

### 2. Setup the Backend:
------------------------

Open a terminal and run:

```bash
cd doctor_tracker_backend
npm ci
```

Create an environment file:

```powershell
Copy-Item .env.example .env
```

Open `doctor_tracker_backend/.env` and configure the following values:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/doctor_tracker
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

Make sure MongoDB is running and the connection string is correct.

### 3. Create Administrator Account:
-----------------------------------

Run the following command to create the first administrator account:

```bash
npm run seed:admin
```

After creating the account, remove `ADMIN_PASSWORD` from your `.env` file.

### 4. Start the Backend Server

```bash
npm run dev
```

The backend server will run at:

`http://127.0.0.1:4000`

You can check the API status using:

`http://127.0.0.1:4000/api/health`

### 5. Setup the Frontend

Open another terminal from the project root:

```bash
cd doctor_tracker_frontend
npm ci
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env.local
```

The `.env.local` file should contain:

```env
BACKEND_ORIGIN=http://127.0.0.1:4000
```

If your backend runs on a different address or port, update this value.

### 6. Start the Frontend:
-------------------------

Run:

```bash
npm run dev
```

Open your browser and visit:

`http://localhost:3000`

Log in using the administrator email and password created earlier.

## Project Structure

```text
doctor-tracker/
├── doctor_tracker_frontend/
│   ├── app/
│   ├── docs/screenshots/
│   ├── .env.example
│   ├── README.md
│   └── package.json
├── doctor_tracker_backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── render.yaml
```

## System Architecture

The application uses a separate frontend and backend. The frontend communicates with the backend through API requests.

```text
Browser
   |
   v
Next.js Frontend
   |
   v
Next.js API Rewrite
   |
   v
Express.js Backend
   |
   v
Mongoose
   |
   v
MongoDB
```

### How It Works:
----------------

1. Users access the application through the Next.js frontend.
2. Administrators log in using their credentials.
3. The backend manages authentication and protects private routes.
4. The frontend communicates with the backend through API requests.
5. The backend processes requests and interacts with MongoDB.
6. Dashboard and directory information are displayed in the frontend.

## Technical Decisions:
-----------------------

### 1. Separate Frontend and Backend

The frontend and backend are maintained separately. Next.js handles the user interface, while Express.js handles API requests, authentication, and database operations.

This makes the application easier to maintain and allows both parts to be developed independently.

### 2. MongoDB Indexing and Pagination

MongoDB indexes are used to improve data retrieval for doctor and patient records.

Pagination helps manage large lists without loading all records at once. Records are sorted by creation date and record ID to maintain consistent ordering.

## Running Project Checks

### Frontend

Navigate to the frontend directory:

```bash
cd doctor_tracker_frontend
```

Run the following commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

### Backend

Navigate to the backend directory:

```bash
cd doctor_tracker_backend
```

Run:

```bash
node --check src/server.js
```

## Additional Information

For environment configuration, check:

- [Backend Environment Example](../doctor_tracker_backend/.env.example)
- [Frontend Environment Example](.env.example)