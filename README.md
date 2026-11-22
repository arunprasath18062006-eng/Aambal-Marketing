# Aambal Marketing Properties — Real Estate Website & Lead CRM

Full-stack real estate website and customer lead management platform for **Aambal Marketing Properties** (Madurai, Tamil Nadu).

## Features
- **Home & Search**: Brand banner, Tamil & English pricing (`1 சதுரடி விலை ரூ. 700/- முதல்`), property search, and featured projects.
- **Yoga Ganapathi Nagar (DTCP Approved 10/2024)**: Full property images, interactive DTCP layout blueprint viewer, 49-plot area & price schedule, road access (`29'6"` & `23'9"` roads), and facilities.
- **Google Maps & Nearby Schools/Hospitals**: Interactive Google Map pinned to Athalai Village, Madurai West with live nearby schools and hospitals search.
- **Customer Enquiry & SQLite Database**: Enquiries saved directly into SQLite (`data/aambal.db`).
- **Admin Leads Dashboard**: Passcode-protected dashboard to view customer leads (`Name`, `Mobile`, `Interested In`, `Location`, `Status`), update statuses, export CSV, and manage property listings.

## Quick Start (Local or Production Server)
1. Install Node.js 22+ (`node -v` >= 22.13).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example` and set:
   - `VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"`
   - `ADMIN_PASSCODE="YOUR_ADMIN_PASSCODE"`
4. Build the frontend:
   ```bash
   npm run build
   ```
5. Start the production server:
   ```bash
   npm start
   ```
   The website runs on `http://localhost:3000` (or `PORT` environment variable).
