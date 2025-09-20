<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19mi9HO88ttJri_mR9qvzq2l4mNciQ7qB

## Run Locally

**Prerequisites:** Node.js 18+, npm, and a MySQL 8.0+ database.

1. Install front-end dependencies:
   ```bash
   npm install
   ```
2. Install API dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```
3. Copy the example environment file and adjust the values for your environment:
   ```bash
   cp .env.example .env
   ```
   The most important settings are:
   * `DATABASE_URL` (or `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) – connection info for MySQL. Tables are created automatically on boot.
   * `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` – credentials required to access the admin dashboard.
   * `ADMIN_JWT_SECRET` / `GUEST_JWT_SECRET` – secrets for signing JSON Web Tokens.
   * `VITE_API_BASE_URL` – URL of the API server (defaults to `http://localhost:4000`).
   * Optional email settings (`MAIL_TO`, `SMTP_*`, or Mailgun credentials) to receive RSVP notifications.
4. Start the API server:
   ```bash
   npm run server
   ```
   The server listens on port `4000` by default.
5. In a second terminal start the Vite dev server:
   ```bash
   npm run dev
   ```
6. Visit the front-end at http://localhost:5173/. Use the admin password from your `.env` file to unlock the dashboard.

## Run with Docker

1. Build the production image (pass any required environment variables via build args or the runtime environment):
   ```bash
   docker build -t party-inviter .
   ```
2. Start the container and provide the necessary environment variables (database credentials, admin password, etc.). Example:
   ```bash
   docker run -d --name party-inviter \
     -e DATABASE_URL="mysql://user:pass@db:3306/party_inviter" \
     -e ADMIN_PASSWORD="super-secret" \
     -e VITE_API_BASE_URL="http://localhost:4000" \
     -p 4000:4000 -p 5173:80 party-inviter
   ```

The API will be available on port 4000 and the front-end on port 80 (mapped to 5173 in the example above). Configure MySQL and any email credentials before deploying in production.
