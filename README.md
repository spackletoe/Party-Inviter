<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19mi9HO88ttJri_mR9qvzq2l4mNciQ7qB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. (Optional) Set the admin password by defining `VITE_ADMIN_PASSWORD` in [.env.local](.env.local). The default value is `admin123`.
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   `npm run dev`

## Run with Docker

1. Build the production image (pass your Gemini key if needed):
   ```bash
   docker build -t party-inviter . --build-arg GEMINI_API_KEY=your-key-here
   ```
2. Start the container:
   ```bash
   docker run -d --name party-inviter -p 8080:80 party-inviter
   ```

The site will be available at http://localhost:8080/ by default. On Unraid, point the Docker template to this repository, set the same build argument if you rely on the Gemini API key, and map container port 80 to an available host port.
