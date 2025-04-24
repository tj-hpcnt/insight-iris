# Insight Iris

Dating profile question and insight generator and manager framework.

## Project Structure

- `backend/` - NestJS application
- `frontend/` - React application with Material-UI
- `prisma/` - Database schema and migrations

## Prerequisites

- Node.js
- npm

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

3. Start the development servers:
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start them separately:
   npm run start:backend
   npm run start:frontend
   ```

## Development

- Backend runs on http://localhost:5100
- Frontend runs on http://localhost:5173

## Tech Stack

- Backend: NestJS
- Frontend: React + Material-UI
- Database: SQLite with Prisma ORM 