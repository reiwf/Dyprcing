import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Component, Event } from "https://esm.sh/ical.js@1.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseICalData(icalData: string) {
  try {
    const jcalData = Component.fromString(icalData);
    const events = jcalData.getAllSubcomponents('vevent').map(vevent => {
      const event = new Event(vevent);
      return {
        startDate: event.startDate.toJSDate().toISOString(),
        endDate: event.endDate.toJSDate().toISOString()
      };
    });
    return events;
  } catch (error) {
    console.error('Error parsing iCal data:', error);
    throw new Error('Failed to parse calendar data');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { icalUrl } = await req.json();
    
    if (!icalUrl) {
      return new Response(
        JSON.stringify({ error: 'icalUrl is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the iCal data
    const response = await fetch(icalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal data: ${response.statusText}`);
    }

    const icalData = await response.text();
    const events = parseICalData(icalData);

    return new Response(
      JSON.stringify({ data: events }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
