# Backend configuration

This backend reads `CLIENT_URL` from environment variables to configure CORS.

- `CLIENT_URL` may contain a single URL or multiple comma-separated origins.
  - Examples:
    - `CLIENT_URL=http://localhost:5173`
    - `CLIENT_URL=http://localhost:5173,https://pdel-front.onrender.com,https://www.bujumburapadel.club`

Notes:
- Do NOT commit `.env` to source control. Ensure `.gitignore` contains `.env`.
- If you deploy to Render, set the `CLIENT_URL` environment variable in the service settings.
- For local development, `NODE_ENV=development` will allow all origins.
