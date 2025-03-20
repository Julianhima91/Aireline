import { FlightOption } from '../types/flight';
import { SearchParams } from '../types/search';
import { formatDuration } from './format';
import { splitFlightSegments } from './flightSegments';
import { calculateCommission } from './commission';

function formatAlbanianDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nentor', 'Dhjetor'
  ];
  return `${day} ${months[date.getMonth()]}`;
}

function formatAlbanianTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('sq-AL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatLayoverDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ore${hours !== 1 ? '' : ''} e ${mins} Minuta`;
}

function getTotalPassengersText(passengers: SearchParams['passengers']): string {
  const parts = [];
  if (passengers.adults > 0) {
    parts.push(`${passengers.adults} te rritur`);
  }
  if (passengers.children > 0) {
    parts.push(`${passengers.children} femije`);
  }
  if (passengers.infantsInSeat > 0) {
    parts.push(`${passengers.infantsInSeat} femije nen 2 vjec me karrige`);
  }
  if (passengers.infantsOnLap > 0) {
    parts.push(`${passengers.infantsOnLap} femije nen 2 vjec pa karrige`);
  }

  return parts.join(' dhe ');
}

export async function formatFlightMessage(
  flight: FlightOption,
  searchParams: SearchParams,
  batchId: string
): Promise<string> {
  // Split flights into outbound and return segments
  const { outboundFlights, returnFlights } = splitFlightSegments(flight.flights, searchParams);
  const isRoundTrip = searchParams.tripType === 'roundTrip';
  const totalPassengers = getTotalPassengersText(searchParams.passengers);

  // Calculate commission
  const commission = await calculateCommission(searchParams.passengers);
  const totalPrice = flight.price;

  let message = '';

  // Format outbound flights
  if (outboundFlights.length === 1) {
    // Direct flight
    const outbound = outboundFlights[0];
    message += `${searchParams.fromLocation} - ${searchParams.toLocation}\n`;
    message += `Data: ${formatAlbanianDate(outbound.departure_airport.time)}\n`;
    message += `Orari Nisjes - ${formatAlbanianTime(outbound.departure_airport.time)}\n`;
    message += `Orari Mberritjes - ${formatAlbanianTime(outbound.arrival_airport.time)}\n\n`;
  } else {
    // Flight with stops
    message += `Nisja Date: ${formatAlbanianDate(outboundFlights[0].departure_airport.time)}\n\n`;
    
    outboundFlights.forEach((segment, index) => {
      message += `${segment.departure_airport.name} - ${segment.arrival_airport.name}\n`;
      message += `Orari Nisjes - ${formatAlbanianTime(segment.departure_airport.time)} `;
      message += `Mberritja ${formatAlbanianTime(segment.arrival_airport.time)}\n\n`;

      // Add layover information if there's a next segment
      if (index < outboundFlights.length - 1 && flight.layovers?.[index]) {
        message += `Pritje ${formatLayoverDuration(flight.layovers[index].duration)} ne ${flight.layovers[index].name}\n\n`;
      }
    });
  }

  // Format return flights if round trip
  if (isRoundTrip && returnFlights && returnFlights.length > 0) {
    if (returnFlights.length === 1) {
      // Direct return flight
      const returnFlight = returnFlights[0];
      message += `Kthimi\n\n`;
      message += `${searchParams.toLocation} - ${searchParams.fromLocation}\n`;
      message += `Data: ${formatAlbanianDate(returnFlight.departure_airport.time)}\n`;
      message += `Orari Nisjes - ${formatAlbanianTime(returnFlight.departure_airport.time)}\n`;
      message += `Orari Mberritjes - ${formatAlbanianTime(returnFlight.arrival_airport.time)}\n\n`;
    } else {
      // Return flight with stops
      message += `Kthimi Date: ${formatAlbanianDate(returnFlights[0].departure_airport.time)}\n\n`;
      
      returnFlights.forEach((segment, index) => {
        message += `${segment.departure_airport.name} - ${segment.arrival_airport.name}\n`;
        message += `Orari Nisjes - ${formatAlbanianTime(segment.departure_airport.time)} `;
        message += `Mberritja ${formatAlbanianTime(segment.arrival_airport.time)}\n\n`;

        // Add layover information if there's a next segment
        if (index < returnFlights.length - 1 && flight.layovers?.[index + outboundFlights.length]) {
          message += `Pritje ${formatLayoverDuration(flight.layovers[index + outboundFlights.length].duration)} ne ${flight.layovers[index + outboundFlights.length].name}\n\n`;
        }
      });
    }
  }

  // Add price information with commission included
  message += `Cmimi: ${Math.floor(totalPrice)} Euro / Ne total per ${totalPassengers}\n`;

  return message;
}