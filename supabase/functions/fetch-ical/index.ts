import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { icalUrl } = await req.json()
    
    if (!icalUrl) {
      return new Response(
        JSON.stringify({ error: 'icalUrl is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch the iCal data
    const response = await fetch(icalUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal data: ${response.statusText}`)
    }

    const icalData = await response.text()

    return new Response(
      JSON.stringify({ data: icalData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
