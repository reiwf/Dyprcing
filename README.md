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
- Render.com for deployment

## Prerequisites

- Node.js 16+
- npm 7+
- Supabase account
- Render.com account (for deployment)

## Supabase Setup Guide

1. Create a Supabase Project:
   - Go to [Supabase](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Fill in your project details
   - Wait for the database to be ready

2. Get Your Project Credentials:
   - In your project dashboard, go to Settings -> API
   - Copy your Project URL (under Config / URL)
   - Copy your anon/public key (under Project API keys)

3. Set Up Database Tables:
   - Go to SQL Editor in your Supabase dashboard
   - Run the following SQL to create the necessary tables and policies:

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

4. Configure Authentication:
   - In your Supabase dashboard, go to Authentication -> Settings
   - Under "Site URL", add your development URL (http://localhost:5173)
   - Enable Email provider under Authentication -> Providers
   - (Optional) Configure email templates under Authentication -> Email Templates

5. Set Up Environment Variables:
   ```bash
   cp .env.example .env
   ```
   Then edit .env and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Airbnb iCal Integration

To import reservations from Airbnb:

1. Go to your Airbnb listing
2. Find the Export Calendar option (usually under Calendar Settings)
3. Copy the iCal URL
4. Paste the URL in the Import Calendar section of your listing in Dyna

Note: For development, the application uses a CORS proxy (cors-anywhere) to fetch iCal data. In production, you should:
- Either set up your own proxy server
- Or use Supabase Edge Functions to handle the iCal fetching server-side
- Or configure proper CORS headers on your server

To use cors-anywhere in development:
1. Visit https://cors-anywhere.herokuapp.com/corsdemo
2. Click the "Request temporary access" button
3. Your iCal imports should now work in development

## Deployment to Render.com

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Create a new Static Site on Render.com:
   - Connect your Git repository
   - Use the following settings:
     - Build Command: `npm install && npm run build`
     - Publish Directory: `dist`

3. Add environment variables in Render.com dashboard:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

4. Deploy! Render will automatically build and deploy your site.

## Development Notes

- The dynamic pricing algorithm is currently a placeholder that suggests prices based on occupancy rates
- The calendar shows both Airbnb-imported and manually added reservations
- Occupancy rates are calculated for the current month
- All routes except login and signup are protected and require authentication

## Troubleshooting

1. Authentication Issues:
   - Ensure your Supabase URL and anon key are correct in .env
   - Check that your Site URL is properly set in Supabase dashboard
   - Verify that Email provider is enabled in Authentication settings

2. Database Issues:
   - Confirm all tables and policies are created correctly
   - Check RLS policies if you can't access data after login
   - Verify your database schema matches the types in supabaseClient.ts

3. Calendar Integration Issues:
   - For development: Make sure you've requested temporary access to the CORS proxy
   - Ensure your Airbnb iCal URL is valid and accessible
   - Check network tab for any CORS issues
   - Verify date formats in the reservations table

## Future Improvements

- [ ] More sophisticated pricing algorithm
- [ ] Historical pricing data
- [ ] Competitor analysis
- [ ] Multiple calendar sources
- [ ] Automated price updates
- [ ] Email notifications
- [ ] Mobile app
- [ ] Custom proxy server for iCal fetching
