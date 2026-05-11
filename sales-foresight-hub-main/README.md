# Sales Foresight Hub

Vite + React sales forecasting app backed by Supabase.

## Local Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in the Supabase values.
3. Start the app with `npm run dev`.

## Deployment

Build command: `npm run build`

Publish directory: `dist`

Required environment variables:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

The project includes SPA fallback configuration for Netlify (`public/_redirects`) and Vercel (`vercel.json`).
