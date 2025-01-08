# Dyna iCal Proxy Service

A simple Deno service that proxies iCal calendar requests to avoid CORS issues.

## Deployment to Deno Deploy

1. Install the Deno CLI if you haven't already:
   - Windows (PowerShell): `irm https://deno.land/install.ps1 | iex`
   - macOS/Linux: `curl -fsSL https://deno.land/x/install/install.sh | sh`

2. Create a new project on [Deno Deploy](https://dash.deno.com):
   - Sign in with your GitHub account
   - Click "New Project"
   - Choose "Deploy from GitHub"
   - Select your repository and branch
   - Set the project directory to `/deno`
   - Set the entry point file to `main.ts`

3. Configure Environment Variables:
   - No environment variables needed for this service

4. Update the frontend .env file:
   ```env
   VITE_ICAL_SERVICE=deno
   VITE_DENO_URL=https://your-project-name.deno.dev
   ```

## Local Development

1. Start the service:
   ```bash
   deno task start
   ```
   This will run the service at http://localhost:8000

2. Test the endpoint:
   ```bash
   curl -X POST http://localhost:8000 \
     -H "Content-Type: application/json" \
     -d '{"icalUrl":"https://www.airbnb.com/calendar/ical/123.ics"}'
   ```

## API Documentation

### POST /

Fetches and returns iCal data from the provided URL.

Request body:
```json
{
  "icalUrl": "string" // The URL of the iCal calendar to fetch
}
```

Response:
```json
{
  "data": "string" // The raw iCal data
}
```

Error Response:
```json
{
  "error": "string" // Error message
}
```

## Security

- The service uses CORS headers to allow requests from any origin
- No authentication is required as the service only proxies publicly available iCal feeds
