import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create RapidAPI client
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')!
const flightApiKey = Deno.env.get('FLIGHTAPI_KEY')!

interface RouteUpdate {
  origin: string
  destination: string
  year_month: string
  demand_level: 'HIGH' | 'MEDIUM' | 'LOW'
  update_interval: number
}

async function logError(error: Error, route: RouteUpdate) {
  try {
    await supabase
      .from('route_tracking_errors')
      .insert({
        origin: route.origin,
        destination: route.destination,
        year_month: route.year_month,
        error_message: error.message,
        stack_trace: error.stack
      })
  } catch (err) {
    console.error('Failed to log error:', err)
  }
}

async function updateRouteTracking(route: RouteUpdate) {
  try {
    console.log(`Updating route: ${route.origin} -> ${route.destination} (${route.year_month})`)

    // Get API configuration
    const { data: apiConfig } = await supabase
      .from('flight_api_config')
      .select('*')
      .single()

    if (!apiConfig) {
      throw new Error('API configuration not found')
    }

    // Determine which API to use based on config
    const useRapidApi = apiConfig.active_api === 'rapidapi' || apiConfig.active_api === 'both'
    const useFlightApi = apiConfig.active_api === 'flightapi' || apiConfig.active_api === 'both'

    const apiPromises = []
    let hasDirectFlight = false
    let lowestPrice = Infinity

    // RapidAPI request
    if (useRapidApi) {
      const rapidApiPromise = fetch(
        `https://sky-scanner3.p.rapidapi.com/flights/price-calendar-web?fromEntityId=${route.origin}&toEntityId=${route.destination}&yearMonth=${route.year_month}`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'sky-scanner3.p.rapidapi.com'
          }
        }
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error(`RapidAPI request failed: ${response.statusText}`)
        }
        const data = await response.json()
        if (data.data?.PriceGrids?.Grid?.[0]) {
          data.data.PriceGrids.Grid[0].forEach((day: any) => {
            if (day?.DirectOutboundAvailable) {
              hasDirectFlight = true
            }
            if (day?.DirectOutbound?.Price) {
              lowestPrice = Math.min(lowestPrice, day.DirectOutbound.Price)
            }
            if (day?.Direct?.Price) {
              lowestPrice = Math.min(lowestPrice, day.Direct.Price)
            }
          })
        }
        return { api: 'rapidapi', data }
      })
      apiPromises.push(rapidApiPromise)
    }

    // FlightAPI request
    if (useFlightApi) {
      const flightApiPromise = fetch(
        `https://api.flightapi.io/onewaytrip/${flightApiKey}/${route.origin}/${route.destination}/${route.year_month}-01/1/0/0/Economy/EUR`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error(`FlightAPI request failed: ${response.statusText}`)
        }
        const data = await response.json()
        if (data.itineraries) {
          data.itineraries.forEach((itinerary: any) => {
            if (itinerary.legs?.[0]?.stopCount === 0) {
              hasDirectFlight = true
            }
            if (itinerary.price?.raw) {
              lowestPrice = Math.min(lowestPrice, itinerary.price.raw)
            }
          })
        }
        return { api: 'flightapi', data }
      })
      apiPromises.push(flightApiPromise)
    }

    // Wait for API responses
    const responses = await Promise.allSettled(apiPromises)
    const successfulResponses = responses.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')

    if (successfulResponses.length === 0) {
      throw new Error('All API requests failed')
    }

    // Update calendar prices
    if (lowestPrice !== Infinity) {
      await supabase
        .from('calendar_prices')
        .upsert({
          origin: route.origin,
          destination: route.destination,
          year_month: route.year_month,
          price_grid: { [route.year_month + '-01']: lowestPrice },
          has_direct_flight: hasDirectFlight,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'origin,destination,year_month'
        })
    }

    // Update route tracking
    await supabase
      .from('route_demand_tracking')
      .update({
        last_price_update: new Date().toISOString()
      })
      .match({
        origin: route.origin,
        destination: route.destination,
        year_month: route.year_month
      })

    console.log(`Successfully updated route: ${route.origin} -> ${route.destination}`)
    return true

  } catch (error) {
    console.error('Error updating route:', error)
    await logError(error, route)
    return false
  }
}

serve(async (req) => {
  try {
    // Get routes that need updates
    const { data: routes, error: routesError } = await supabase
      .rpc('get_routes_needing_update', { p_batch_size: 10 })

    if (routesError) {
      throw routesError
    }

    // Process each route
    const results = await Promise.all(
      routes.map(route => updateRouteTracking(route))
    )

    const successCount = results.filter(Boolean).length
    const failureCount = results.length - successCount

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} routes (${successCount} succeeded, ${failureCount} failed)`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Route tracking error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})