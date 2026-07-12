# 💻 AssetFlow — Enterprise IT Asset Management & Booking System

AssetFlow is a visually premium, high-fidelity asset tracking and shared resource booking application. Built with a modern glassmorphic UI, responsive controls, and visual analytics, it serves as a central cockpit for managing hardware inventory, allocation cycles, maintenance requests, and stock audits.

---

## 🎨 Visual & UI Highlights
*   **Premium Glassmorphic Aesthetics**: Modern dark/light theme accents,Outfit/Plus Jakarta Sans typography, custom smooth micro-animations, and styled elements.
*   **Dual-View Asset Catalog**: Grid/List layout switcher with status indicators (allocated, available, under maintenance, retired) and location tags.
*   **Interactive Command Console**: Visual specs sheets, vertical timelines for allocation and maintenance histories, and photo lightbox previews.
*   **Reconciliation & Progress Indicators**: Interactive audit cycle checklist tables and automated progress bar metrics.
*   **Reports & Heatmaps**: Clean Recharts graphs with custom tooltips, alongside week-day hourly booking intensity heatmaps.

---

## 🛠️ Technology Stack
*   **Frontend**: React 19, Vite, Tailwind CSS 4.0, Recharts, Lucide React icons.
*   **Backend**: Node.js, Express, PostgreSQL (`pg` database client).
*   **Styling & Theme**: HSL-tailored custom system tokens, transitions, and unified styling components.

---

## 📂 Project Structure
```
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # Auth, Assets, Allocations, Bookings, Audits, Techs, etc.
│   │   ├── middleware/    # Auth and routing handlers
│   │   ├── db.js          # PostgreSQL connection pool
│   │   ├── app.js         # Core express server configurations
│   │   └── index.js       # Backend entrypoint (port 5000)
│   └── package.json
│
├── frontend/              # Vite + React app
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, Header
│   │   ├── pages/         # Dashboard, Assets, Details, Bookings, Audits, Reports, Setup, etc.
│   │   ├── index.css      # Core styles & Tailwind tokens
│   │   └── main.jsx       # Frontend entrypoint (port 5173)
│   └── package.json
│
├── database/              # SQL files
│   ├── schema.sql         # Table layouts & triggers
│   └── seed.sql           # Initial demo records & updated password hashes
```

---

## 🚀 Installation & Local Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [PostgreSQL](https://www.postgresql.org/) (v15 or higher)

### 1. Database Setup
1. Open your PostgreSQL terminal/CLI:
   ```sql
   CREATE DATABASE assetflow;
   ```
2. Import the schema to build the tables:
   ```bash
   psql -U postgres -d assetflow -f database/schema.sql
   ```
3. Seed the initial demo records:
   ```bash
   psql -U postgres -d assetflow -f database/seed.sql
   ```

### 2. Backend Config
You can create a `.env` file in the `backend/` directory to configure custom credentials:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/assetflow
PORT=5000
JWT_SECRET=super-secret-key-change-in-prod
```
*(If left unset, it automatically connects to localhost on port 5432 with password `postgres`).*

### 3. Running Servers
In the root directory, install the dependencies and run the servers:
```bash
# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend

# Start backend server (API: http://localhost:5000)
npm run dev:backend

# Start frontend Vite server (Web UI: http://localhost:5173)
npm run dev:frontend
```

---

## 🔑 Default Login Credentials

You can sign in using any of the default pre-seeded roles:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@assetflow.com` | `admin123` |
| **Asset Manager** | `manager@assetflow.com` | `password123` |
| **Department Head** | `head@assetflow.com` | `password123` |
| **Employee** | `priya@assetflow.com` | `password123` |
