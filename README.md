# Task Manager

Static app (HTML/CSS/JS) using the Supabase REST API (`fetch`), no build step.

## Setup
1. Create a Supabase project (demo, test data only).
2. Run `supabase.sql` in the SQL Editor (creates `tasks` + RLS policies).
3. Fill `config.json` with your project URL and **publishable** key (never a secret/service-role key).
4. Replace `YOUR_VISTULA_STUDENT_ID` in `index.html` and `contribution.html`.
5. Test locally: `python -m http.server` and open http://localhost:8000
6. Push to GitHub and enable Pages (Settings → Pages → deploy from `main` / root).
