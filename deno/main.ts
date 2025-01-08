// @ts-ignore: Deno module
import { serve } from "./deps.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ICalEvent {
  startDate: string;
  endDate: string;
}

function parseICalData(icalData: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalData.split(/\r?\n/);
  let currentEvent: Partial<ICalEvent> = {};
  let inEvent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (trimmedLine === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.startDate && currentEvent.endDate) {
        events.push(currentEvent as ICalEvent);
      }
    } else if (inEvent) {
      // Handle line continuations
      if (trimmedLine.startsWith(' ') || trimmedLine.startsWith('\t')) {
        continue;
      }

      if (trimmedLine.startsWith('DTSTART')) {
        const dateStr = trimmedLine.split(':')[1];
        try {
          // Try parsing with Date.parse first
          const timestamp = Date.parse(dateStr);
          if (!isNaN(timestamp)) {
            currentEvent.startDate = new Date(timestamp).toISOString();
            continue;
          }

          // Handle different date formats
          let date: Date;
          if (dateStr.includes('T')) {
            // Format: YYYYMMDDTHHMMSSZ
            date = new Date(
              parseInt(dateStr.slice(0, 4)),
              parseInt(dateStr.slice(4, 6)) - 1,
              parseInt(dateStr.slice(6, 8)),
              parseInt(dateStr.slice(9, 11)),
              parseInt(dateStr.slice(11, 13)),
              parseInt(dateStr.slice(13, 15))
            );
          } else {
            // Format: YYYYMMDD
            date = new Date(
              parseInt(dateStr.slice(0, 4)),
              parseInt(dateStr.slice(4, 6)) - 1,
              parseInt(dateStr.slice(6, 8))
            );
          }
          currentEvent.startDate = date.toISOString();
        } catch (error) {
          console.warn('Failed to parse start date:', dateStr, error);
        }
      } else if (trimmedLine.startsWith('DTEND')) {
        const dateStr = trimmedLine.split(':')[1];
        try {
          // Try parsing with Date.parse first
          const timestamp = Date.parse(dateStr);
          if (!isNaN(timestamp)) {
            currentEvent.endDate = new Date(timestamp).toISOString();
            continue;
          }

          // Handle different date formats
          let date: Date;
          if (dateStr.includes('T')) {
            // Format: YYYYMMDDTHHMMSSZ
            date = new Date(
              parseInt(dateStr.slice(0, 4)),
              parseInt(dateStr.slice(4, 6)) - 1,
              parseInt(dateStr.slice(6, 8)),
              parseInt(dateStr.slice(9, 11)),
              parseInt(dateStr.slice(11, 13)),
              parseInt(dateStr.slice(13, 15))
            );
          } else {
            // Format: YYYYMMDD
            date = new Date(
              parseInt(dateStr.slice(0, 4)),
              parseInt(dateStr.slice(4, 6)) - 1,
              parseInt(dateStr.slice(6, 8))
            );
          }
          currentEvent.endDate = date.toISOString();
        } catch (error) {
          console.warn('Failed to parse end date:', dateStr, error);
        }
      }
    }
  }

  return events;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
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

    console.log('Fetching iCal data from:', icalUrl);

    // Fetch the iCal data with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(icalUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Dyna-iCal-Service/1.0'
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch iCal data: ${response.statusText} (${response.status})`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      const icalData = await response.text();
      console.log('Received iCal data length:', icalData.length);
      console.log('First 100 chars:', icalData.slice(0, 100));

      if (!icalData.includes('BEGIN:VCALENDAR')) {
        throw new Error('Invalid iCal data: Missing VCALENDAR header');
      }

      const events = parseICalData(icalData);
      console.log('Successfully parsed events:', events.length);
      console.log('First event:', events[0]);

      return new Response(
        JSON.stringify({ data: events }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
