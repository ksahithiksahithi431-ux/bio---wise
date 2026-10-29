# Bio Wise — Biogas Estimation

A beginner-friendly full-stack project with:
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Features: estimate biogas from waste type and quantity, save estimates, view history, delete records, and see dashboard totals.

## 1. Requirements
Install Node.js (LTS) on your computer. This project uses npm.

## 2. Set up Supabase
1. Create a project at https://supabase.com/.
2. Open **SQL Editor** and run `database/schema.sql`.
3. In Supabase project settings, copy the Project URL and a server-side key (use the current secret/service-role key for a private backend; never put it in frontend JavaScript).

## 3. Configure the backend
1. Open the `backend` folder.
2. Rename `.env.example` to `.env` (or edit the included `.env`).
3. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with your own Supabase project values.
4. Keep `.env` private. Do not upload it to GitHub or share it publicly.

The included `.env` contains placeholders only; it will not connect until you add your own values.

## 4. Install and run
Open a terminal in the `backend` folder and run:

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## 5. Estimation formula
Estimated biogas (m³) = quantity of waste (kg) × assumed yield (m³/kg).

The default yields are illustrative estimates, not guaranteed real-world outputs. Update them for your local feedstock and operating conditions.

## API
- `GET /api/estimates` — list saved estimates
- `POST /api/estimates` — save an estimate
- `DELETE /api/estimates/:id` — delete an estimate
- `GET /api/health` — server status

## Troubleshooting
- If `npm` is not recognized, install Node.js LTS from https://nodejs.org/ and restart your terminal.
- If database requests fail, check the Supabase URL/key and confirm you ran `database/schema.sql`.
- This starter app is intended for local learning/demo use. Add authentication and authorization before deploying it for multiple users.
