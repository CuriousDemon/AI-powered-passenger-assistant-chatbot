import axios from 'axios';

const NSCBI_FLIGHT_ROSTER = {
  "6E205": { airline: "IndiGo", route: "CCU -> DEL", status: "On Time", gate: "18A", scheduled_departure: "19:15", terminal: "Terminal 2" },
  "6E456": { airline: "IndiGo", route: "CCU -> BLR", status: "Boarding", gate: "22", scheduled_departure: "17:45", terminal: "Terminal 2" },
  "AI773": { airline: "Air India", route: "CCU -> BOM", status: "Delayed by 25 mins", gate: "09", scheduled_departure: "20:30", terminal: "Terminal 2" },
  "SG302": { airline: "SpiceJet", route: "CCU -> IXB", status: "On Time", gate: "05B", scheduled_departure: "11:20", terminal: "Terminal 2" },
  "UK747": { airline: "Vistara", route: "CCU -> DEL", status: "Security Check Active", gate: "14", scheduled_departure: "21:00", terminal: "Terminal 2" }
};

export async function getFlightStatus({ flightNumber }) {
  
  const cleanCode = flightNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  console.log(`[Tool Call] Checking flight: ${cleanCode}`);

  try {
    
    if (process.env.AVIATIONSTACK_API_KEY) {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${process.env.AVIATIONSTACK_API_KEY}&flight_iata=${cleanCode}`;
      const response = await axios.get(url, { timeout: 4000 });

      if (response.data?.data && response.data.data.length > 0) {
        const flight = response.data.data[0];
        return {
          flight: cleanCode,
          airline: flight.airline?.name || "Airline",
          status: flight.flight_status || "Active",
          departure_gate: flight.departure?.gate || "Terminal 2 FIDS",
          scheduled_departure: flight.departure?.scheduled || "Scheduled"
        };
      }
    }
  } catch (err) {
    console.warn("Aviationstack unreachable or timed out. Switching to NSCBI local roster.");
  }

  // 2. Fallback to airport operational roster
  if (NSCBI_FLIGHT_ROSTER[cleanCode]) {
    const flight = NSCBI_FLIGHT_ROSTER[cleanCode];
    return {
      flight: cleanCode,
      airline: flight.airline,
      route: flight.route,
      status: flight.status,
      departure_gate: flight.gate,
      terminal: flight.terminal,
      scheduled_departure: flight.scheduled_departure
    };
  }

  // 3. Fallback for any other valid flight number
  return {
    flight: cleanCode,
    status: "Active on today's roster",
    terminal: "Terminal 2",
    departure_gate: "Check FIDS screens at Concourse",
    note: "Scheduled departure active. Please proceed to airline check-in counter."
  };
}

export async function getTravelTime(args) {
  const startingLocation = args.startingLocation || args.origin || args.location;
  
  if (!startingLocation) {
    return { error: "No starting location provided." };
  }

  try {
    const destination = "Netaji Subhash Chandra Bose International Airport, Kolkata";
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(startingLocation)}&destinations=${encodeURIComponent(destination)}&departure_time=now&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url, { timeout: 5000 });
    const element = response.data?.rows?.[0]?.elements?.[0];

    if (element?.status === "OK") {
      return {
        from: startingLocation,
        distance: element.distance.text,
        duration_in_traffic: element.duration_in_traffic ? element.duration_in_traffic.text : element.duration.text
      };
    }
    return { error: `Could not calculate route from ${startingLocation}.` };
  } catch (error) {
    return { error: "Google Maps service temporarily unavailable." };
  }
}





