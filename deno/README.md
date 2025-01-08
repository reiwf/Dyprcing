# Dyna iCal Proxy Service

A Deno service that proxies iCal calendar requests to avoid CORS issues.

## Deployment to Deno Deploy

1. Go to [Deno Deploy](https://dash.deno.com)
2. Create a new project
3. Choose "Deploy from URL"
4. Enter the following settings:
   - Name: `dyna-ical` (or your preferred name)
   - Production Branch: `main`
   - Entry Point: `main.ts`

5. After deployment, copy your production URL (e.g., `https://dyna-ical.deno.dev`)

6. Update your frontend `.env` file:
   ```env
   VITE_ICAL_SERVICE=deno
   VITE_DENO_URL=your-deno-deploy-url
   ```

## Testing the Deployment

1. Make a test request using curl:
   ```bash
   curl -X POST https://your-deno-deploy-url \
     -H "Content-Type: application/json" \
     -d '{"icalUrl":"https://www.airbnb.com/calendar/ical/123.ics"}'
   ```

2. Check the response format:
   ```json
   {
     "data": [
       {
         "startDate": "2024-01-01T00:00:00.000Z",
         "endDate": "2024-01-02T00:00:00.000Z"
       }
     ]
   }
   ```

## Troubleshooting

1. CORS Issues:
   - Verify the request is using HTTPS
   - Check browser console for detailed error messages
   - Ensure the Deno Deploy URL is correct in .env

2. iCal Parsing Issues:
   - Check the Deno Deploy logs for parsing errors
   - Verify the Airbnb iCal URL is valid
   - Look for any date format issues in the logs

3. Network Issues:
   - Ensure your Deno Deploy service is running
   - Check for any rate limiting or blocking by Airbnb
   - Verify your network can reach both Deno Deploy and Airbnb

## Local Development

1. Install Deno:
   - Windows (PowerShell):
     ```powershell
     irm https://deno.land/install.ps1 | iex
     ```
   - macOS/Linux:
     ```bash
     curl -fsSL https://deno.land/x/install/install.sh | sh
     ```

2. Run the service locally:
   ```bash
   deno task dev
   ```
   This will start the service at http://localhost:8000

3. Test with curl:
   ```bash
   curl -X POST http://localhost:8000 \
     -H "Content-Type: application/json" \
     -d '{"icalUrl":"your-ical-url"}'
   ```

## Monitoring

1. View Logs:
   - Go to your project in Deno Deploy dashboard
   - Click on "Logs" tab
   - Filter by severity (error, info, debug)

2. Performance Metrics:
   - Monitor request counts
   - Check response times
   - Track error rates

## Security Notes

- The service only accepts POST requests
- No authentication is required (proxy for public iCal feeds)
- Rate limiting is handled by Deno Deploy
- CORS is configured to allow requests from any origin
- Only fetches from provided iCal URLs
