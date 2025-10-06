# Allura Forum – Restore Guide

## Steps to Restore

1. Extract this ZIP into your new project folder.

2. Install dependencies:
   npm install

3. Import the database (Postgres example):
   psql $DATABASE_URL < allura_database_backup.sql

4. Set environment variables:
   - DATABASE_URL=your_postgres_connection_string
   - SESSION_SECRET=your_secret_key

5. Start the project:
   npm run dev

## Contents
- client/        → React frontend
- server/        → Backend (routes, auth, storage, etc.)
- shared/        → Shared schema & types
- package.json   → Dependencies
- drizzle.config.ts → Database config
- tsconfig.json  → TypeScript config
- vite.config.ts → Build config
- tailwind.config.ts → Styling config
- replit.md      → Project notes
- allura_database_backup.sql → Database backup

Enjoy your restored Allura Forum!
