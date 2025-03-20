import { supabase } from "./supabase";
import { SearchParams } from "../types/search";
import { formatErrorMessage, makeCloneable } from "./format";
import { parseRapidApiResponse } from "./flightParser";
import { parseFlightApiResponse } from "./flightApiParser";
import axios from "axios";
import { deduplicateFlights } from "./flightDeduplication";

interface ApiResponse {
  api: string;
  responseTime: number;
  results: any;
}

const ongoingSearches = new Map<string, Promise<any>>();

async function getApiConfig() {
  try {
    const { data, error } = await supabase
      .from("flight_api_config")
      .select("*")
      .single();
    if (error) {
      console.error("Error fetching API config:", error);
      return {
        active_api: "rapidapi",
        simultaneous_requests: false,
        oneway_api: "rapidapi",
        roundtrip_api: "rapidapi",
        rapidapi_key: "eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5",
        flightapi_key: "6575f4e37c8bf3d205a36818"
      };
    }
    return data;
  } catch (err) {
    console.error("Error fetching API config:", err);
    return {
      active_api: "rapidapi",
      simultaneous_requests: false,
      oneway_api: "rapidapi",
      roundtrip_api: "rapidapi",
      rapidapi_key: "eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5",
      flightapi_key: "6575f4e37c8bf3d205a36818"
    };
  }
}

async function searchWithRapidAPI(params: SearchParams, apiKey: string) {
  const startTime = Date.now();
  const MAX_RETRIES = 2;
  const INITIAL_RETRY_DELAY = 1000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`RapidAPI retry attempt ${attempt} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, INITIAL_RETRY_DELAY * attempt));
      }
      const endpoint =
        params.tripType === "roundTrip"
          ? "flights/search-roundtrip"
          : "flights/search-one-way";
      const cabinClass =
        { "1": "economy", "2": "premium_economy", "3": "business", "4": "first" }[
          params.travelClass
        ] || "economy";
      const stops =
        params.stops === "1"
          ? "direct"
          : params.stops === "2"
          ? "direct,1stop"
          : params.stops === "3"
          ? "direct,1stop,2stops"
          : "direct,1stop,2stops,3stops";
      const requestParams: Record<string, string> = {
        fromEntityId: params.fromCode,
        toEntityId: params.toCode,
        departDate: params.departureDate.split("T")[0],
        currency: "EUR",
        stops,
        adults: params.passengers.adults.toString(),
        children: params.passengers.children.toString(),
        infants: (
          params.passengers.infantsInSeat + params.passengers.infantsOnLap
        ).toString(),
        cabinClass
      };
      if (params.tripType === "roundTrip" && params.returnDate) {
        requestParams.returnDate = params.returnDate.split("T")[0];
      }
      console.log(`RapidAPI Request (attempt ${attempt + 1}):`, {
        endpoint,
        params: requestParams
      });
      const response = await axios.get(
        `https://sky-scanner3.p.rapidapi.com/${endpoint}`,
        {
          params: requestParams,
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "sky-scanner3.p.rapidapi.com"
          },
          timeout: 30000 // 30 second timeout
        }
      );
      console.log("RapidAPI Response:", response.data);
      return parseRapidApiResponse(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED" || err.response?.status === 429) {
          console.error("RapidAPI error (attempt " + (attempt + 1) + "):", err.message);
          if (attempt < MAX_RETRIES) continue;
          return null;
        }
        console.error("RapidAPI error:", err.response?.data || err.message);
        if (attempt < MAX_RETRIES) continue;
        return null;
      }
      console.error("RapidAPI error:", err);
      if (attempt < MAX_RETRIES) continue;
      return null;
    } finally {
      // (Optional) Update API stats here...
    }
  }
  return null;
}

async function searchWithFlightAPI(params: SearchParams, apiKey: string) {
  const startTime = Date.now();
  const MAX_RETRIES = 2;
  const INITIAL_RETRY_DELAY = 1000;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`FlightAPI retry attempt ${attempt} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, INITIAL_RETRY_DELAY * attempt));
      }
      const endpoint = params.tripType === "roundTrip" ? "roundtrip" : "onewaytrip";
      const baseUrl = `https://api.flightapi.io/${endpoint}/${apiKey}`;
      const urlParts = [
        params.fromCode,
        params.toCode,
        params.departureDate.split("T")[0],
        params.tripType === "roundTrip" ? params.returnDate?.split("T")[0] : null,
        params.passengers.adults.toString(),
        params.passengers.children.toString(),
        (params.passengers.infantsInSeat + params.passengers.infantsOnLap).toString(),
        "Economy",
        "EUR"
      ];
      const urlParams = urlParts.filter(part => part !== null).join("/");
      console.log(`FlightAPI Request URL (attempt ${attempt + 1}):`, `${baseUrl}/${urlParams}`);
      const response = await axios.get(`${baseUrl}/${urlParams}`, {
        timeout: 30000
      });
      console.log("FlightAPI Response:", response.data);
      return parseFlightApiResponse(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED" || err.response?.status === 429) {
          console.error("FlightAPI error (attempt " + (attempt + 1) + "):", err.message);
          if (attempt < MAX_RETRIES) continue;
          return null;
        }
        console.error("FlightAPI error:", err.response?.data || err.message);
        if (attempt < MAX_RETRIES) continue;
        return null;
      }
      console.error("FlightAPI error:", err);
      if (attempt < MAX_RETRIES) continue;
      return null;
    } finally {
      // (Optional) Update API stats here...
    }
  }
  return null;
}

export async function searchFlights(
  params: SearchParams,
  onProgress?: (progress: { results: any; isComplete: boolean; }) => void
): Promise<{ best_flights: any[]; other_flights: any[] }> {
  const searchKey = `${params.fromCode}-${params.toCode}-${params.departureDate}-${params.returnDate || "oneway"}`;
  if (ongoingSearches.has(searchKey)) {
    return ongoingSearches.get(searchKey)!;
  }

  const searchPromise = (async () => {
    try {
      // Validate parameters
      if (!params.fromCode || !params.toCode) {
        throw new Error("Please select both departure and arrival airports.");
      }
      if (!params.departureDate) {
        throw new Error("Please select a departure date.");
      }
      if (params.tripType === "roundTrip" && !params.returnDate) {
        throw new Error("Please select a return date for round-trip flights.");
      }

      const apiConfig = await getApiConfig();
      console.log("Using API config:", apiConfig);

      // --- If only one API is active ---
      if (apiConfig.active_api === "rapidapi") {
        const result = await searchWithRapidAPI(params, apiConfig.rapidapi_key);
        if (!result) throw new Error("No flights found. Please try again later.");
        onProgress && onProgress({ results: makeCloneable(result), isComplete: true });
        return makeCloneable(result);
      }
      if (apiConfig.active_api === "flightapi") {
        const result = await searchWithFlightAPI(params, apiConfig.flightapi_key);
        if (!result) throw new Error("No flights found. Please try again later.");
        onProgress && onProgress({ results: makeCloneable(result), isComplete: true });
        return makeCloneable(result);
      }

      // --- If both APIs are active ---
      if (apiConfig.active_api === "both") {
        if (apiConfig.simultaneous_requests) {
          // Prepare an object to accumulate merged results
          const mergedResults = { best_flights: [] as any[], other_flights: [] as any[] };
          const seenKeys = new Set<string>();

          // Helper: add unique flights from a result
          function addUniqueFlights(result: { best_flights: any[]; other_flights: any[]; }) {
            const addList = (list: any[]) => {
              list.forEach(flight => {
                const key = flight.flights.map((f: any) => f.flight_number).join("-");
                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  return flight;
                }
                return null;
              });
            }
            // For simplicity, we concatenate and deduplicate afterward.
            mergedResults.best_flights = mergedResults.best_flights.concat(result.best_flights);
            mergedResults.other_flights = mergedResults.other_flights.concat(result.other_flights);
          }

          let firstResponseReceived = false;
          // Fire both API requests in parallel
          const rapidPromise = searchWithRapidAPI(params, apiConfig.rapidapi_key)
            .then(result => {
              if (result) {
                if (!firstResponseReceived) {
                  firstResponseReceived = true;
                  onProgress && onProgress({ results: makeCloneable(result), isComplete: false });
                }
                addUniqueFlights(result);
              }
            });
          const flightPromise = searchWithFlightAPI(params, apiConfig.flightapi_key)
            .then(result => {
              if (result) {
                if (!firstResponseReceived) {
                  firstResponseReceived = true;
                  onProgress && onProgress({ results: makeCloneable(result), isComplete: false });
                }
                addUniqueFlights(result);
              }
            });
          await Promise.all([rapidPromise, flightPromise]);
          // Deduplicate the final merged results
          const finalResults = {
            best_flights: deduplicateFlights(mergedResults.best_flights),
            other_flights: deduplicateFlights(mergedResults.other_flights)
          };
          onProgress && onProgress({ results: makeCloneable(finalResults), isComplete: true });
          return makeCloneable(finalResults);
        } else {
          // If simultaneous_requests is false, use Promise.race (show first response)
          const firstResult = await Promise.race([
            searchWithRapidAPI(params, apiConfig.rapidapi_key),
            searchWithFlightAPI(params, apiConfig.flightapi_key)
          ]);
          if (!firstResult) {
            throw new Error("No flights found. Please try again later.");
          }
          onProgress && onProgress({ results: makeCloneable(firstResult), isComplete: true });
          return makeCloneable(firstResult);
        }
      }
      throw new Error("Invalid API configuration");
    } catch (error) {
      console.error("Flight search error:", error);
      throw error;
    } finally {
      ongoingSearches.delete(searchKey);
    }
  })();
  ongoingSearches.set(searchKey, searchPromise);
  return searchPromise;
}