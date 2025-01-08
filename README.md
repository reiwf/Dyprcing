# Dyna - Airbnb Dynamic Pricing SaaS

A React + TypeScript application for managing Airbnb listings with dynamic pricing suggestions based on occupancy rates.

## Features

- User Authentication (Sign Up, Log In, Log Out)
- Protected Dashboard
- Listing Management
- Calendar Integration with Airbnb iCal
- Occupancy Rate Calculation
- Dynamic Pricing Suggestions
- Responsive Design with Tailwind CSS

## Tech Stack

- React + TypeScript
- Supabase (Authentication & Database)
- FullCalendar
- Tailwind CSS
- Vite
- Multiple deployment options for iCal fetching

## Prerequisites

- Node.js 16+
- npm 7+
- Supabase account
- One of the following for iCal fetching:
  - Deno Deploy account (recommended)
  - Render.com account
  - Supabase project with Edge Functions enabled

## iCal Integration Options

The application supports three methods for handling iCal calendar imports:

### Option 1: Deno Deploy (Recommended)

The simplest option that uses Deno Deploy to handle iCal fetching:

1. Deploy the Deno service:
   - See `/deno/README.md` for deployment instructions
   - Get your Deno Deploy URL

2. Configure the frontend:
   ```env
   VITE_ICAL_SERVICE=deno
   VITE_DENO_URL=https://your-project-name.deno.dev
   ```

### Option 2: Express Proxy Server

A standalone Node.js server that can be deployed to Render.com:

1. Deploy the proxy server:
   - Push the `/server` directory to your repository
   - Create a new Web Service on Render.com
   - Use the settings from `/server/render.yaml`

2. Configure the frontend:
   ```env
   VITE_ICAL_SERVICE=proxy
   VITE_PROXY_URL=your-render-service-url
   ```

### Option 3: Supabase Edge Function

Uses Supabase's Edge Functions (requires a paid plan):

1. Deploy the Edge Function:
   - See Supabase Edge Functions documentation
   - Deploy the function from `/supabase/functions/fetch-ical`

2. Configure the frontend:
   ```env
   VITE_ICAL_SERVICE=supabase
   ```

## Local Development Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key
   - Create the following tables:

   ```sql
   -- Create listings table
   create table listings (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users(id),
     title text not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   -- Create reservations table
   create table reservations (
     id uuid default uuid_generate_v4() primary key,
     listing_id uuid references listings(id),
     start_date date not null,
     end_date date not null,
     source text not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   -- Set up RLS policies
   alter table listings enable row level security;
   alter table reservations enable row level security;

   -- Listings policies
   create policy "Users can view their own listings" on listings
     for select using (auth.uid() = user_id);

   create policy "Users can insert their own listings" on listings
     for insert with check (auth.uid() = user_id);

   -- Reservations policies
   create policy "Users can view reservations for their listings" on reservations
     for select using (
       exists (
         select 1 from listings
         where listings.id = reservations.listing_id
         and listings.user_id = auth.uid()
       )
     );

   create policy "Users can insert reservations for their listings" on reservations
     for insert with check (
       exists (
         select 1 from listings
         where listings.id = reservations.listing_id
         and listings.user_id = auth.uid()
       )
     );
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit .env with your Supabase credentials and preferred iCal service.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

1. Deploy the frontend to Render.com:
   - Push your code to a Git repository
   - Create a new Static Site on Render.com
   - Use the settings from `render.yaml`
   - Add your environment variables

2. Deploy your chosen iCal service (see iCal Integration Options above)

3. Update environment variables in Render.com dashboard:
   - Add your Supabase credentials
   - Add your chosen iCal service configuration

## Development Notes

- The dynamic pricing algorithm is currently a placeholder
- The calendar shows both Airbnb-imported and manually added reservations
- Occupancy rates are calculated for the current month
- All routes except login and signup are protected

## Troubleshooting

1. Authentication Issues:
   - Verify Supabase credentials
   - Check Site URL in Supabase settings
   - Ensure Email provider is enabled

2. Database Issues:
   - Verify table creation and RLS policies
   - Check database permissions
   - Review Supabase logs

3. Calendar Import Issues:
   - Verify iCal URL format
   - Check your chosen iCal service configuration
   - Review service logs (Deno/Render/Supabase)
   - Test with the provided example iCal URL

## Future Improvements

- [ ] More sophisticated pricing algorithm
- [ ] Historical pricing data
- [ ] Competitor analysis
- [ ] Multiple calendar sources
- [ ] Automated price updates
- [ ] Email notifications
- [ ] Mobile app
