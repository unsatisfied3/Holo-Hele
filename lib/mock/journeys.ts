import type {
  JourneyCoordinate,
  JourneyOption,
} from "@/types/transit";

export type {
  JourneyCoordinate,
  JourneyLocation,
  JourneyOption,
  JourneyStop,
} from "@/types/transit";

export interface SearchBusResult {
  id: string;
  route: string;
  name: string;
  detail: string;
  searchTerms: string[];
  busDetailId?: string;
  routePreviewId?: string;
}

export interface SearchPlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const SEARCH_BUSES: SearchBusResult[] = [
  {
    id: "bus-a",
    route: "A",
    name: "A - CityExpress! U.H. Manoa",
    detail: "Kaoonohi St + Moanalua Lp → Sinclair Circle",
    searchTerms: ["ala moana", "cityexpress", "uh manoa", "sinclair circle"],
    busDetailId: "a-437",
  },
  {
    id: "bus-1l",
    route: "1L",
    name: "1L - Hawaiʻi Kai - Limited Stops",
    detail: "Hālawa Aloha Stadium Station → Hawaiʻi Kai",
    searchTerms: ["hawaii kai", "halawa stadium", "limited stops"],
    routePreviewId: "1l-hawaii-kai",
  },
];

export const SEARCH_PLACES: SearchPlaceResult[] = [
  {
    id: "ala-moana-center",
    name: "Ala Moana Center",
    address: "1450 Ala Moana Blvd, Honolulu, HI 96814",
    lat: 21.29072,
    lng: -157.84278,
  },
  {
    id: "ala-moana-beach",
    name: "Ala Moana Beach Park",
    address: "1201 Ala Moana Blvd, Honolulu, HI 96814",
    lat: 21.29008,
    lng: -157.85176,
  },
  {
    id: "ala-wai-canal",
    name: "Ala Wai Canal",
    address: "Ala Wai Blvd, Honolulu, HI 96815",
    lat: 21.2825,
    lng: -157.83595,
  },
];

const ALA_MOANA_JOURNEY = {
  walkStartMinutes: 2,
  walkStartDistance: "160 m",
  routeHeadsign: "Waikīkī Beach & Hotels",
  rideMinutes: 8,
  rideStops: 5,
  walkEndMinutes: 3,
  walkEndDistance: "220 m",
  origin: {
    name: "Current location",
    detail: "S King Street near Punchbowl Street",
    coordinate: [21.30618, -157.85753] as JourneyCoordinate,
    time: "9:42 AM",
  },
  boardStop: {
    id: "131",
    name: "S King St + Punchbowl St",
    detail: "Stop 131",
    coordinate: [21.305103, -157.858239] as JourneyCoordinate,
    time: "9:45 AM",
  },
  alightStop: {
    id: "761",
    name: "Ala Moana Blvd + Ala Moana Center",
    detail: "Stop 761",
    coordinate: [21.289896, -157.844534] as JourneyCoordinate,
    time: "9:53 AM",
  },
  rideStopSequence: [
    {
      id: "131",
      name: "S King St + Punchbowl St",
      detail: "",
      coordinate: [21.305103, -157.858239] as JourneyCoordinate,
      time: "9:45 AM",
    },
    {
      id: "132",
      name: "S King St + South St",
      detail: "",
      coordinate: [21.30282, -157.85942] as JourneyCoordinate,
      time: "9:47 AM",
    },
    {
      id: "135",
      name: "S King St + Ward Ave",
      detail: "",
      coordinate: [21.29982, -157.85864] as JourneyCoordinate,
      time: "9:49 AM",
    },
    {
      id: "761",
      name: "Ala Moana Blvd + Ala Moana Center",
      detail: "",
      coordinate: [21.289896, -157.844534] as JourneyCoordinate,
      time: "9:53 AM",
    },
  ],
  destination: {
    name: "Ala Moana Center",
    detail: "1450 Ala Moana Blvd, Honolulu, HI 96814",
    coordinate: [21.29072, -157.84278] as JourneyCoordinate,
    time: "9:56 AM",
  },
  walkingInstructions: [
    "Head southwest on S King Street toward Punchbowl Street.",
    "The Route 42 stop is on your right.",
  ],
  nextTransitStop: "S King St + South St",
  path: {
    walkStart: [
      [21.30618, -157.85753],
      [21.30572, -157.85779],
      [21.305103, -157.858239],
    ] as JourneyCoordinate[],
    transit: [
      [21.305103, -157.858239],
      [21.30282, -157.85942],
      [21.29982, -157.85864],
      [21.2968, -157.85496],
      [21.29412, -157.85112],
      [21.29194, -157.84731],
      [21.289896, -157.844534],
    ] as JourneyCoordinate[],
    walkEnd: [
      [21.289896, -157.844534],
      [21.29024, -157.84369],
      [21.29072, -157.84278],
    ] as JourneyCoordinate[],
  },
  simulation: {
    walkingPosition: [21.30572, -157.85779] as JourneyCoordinate,
    transitPosition: [21.2968, -157.85496] as JourneyCoordinate,
    transitPathIndex: 3,
  },
};

export const JOURNEY_OPTIONS: JourneyOption[] = [
  {
    ...ALA_MOANA_JOURNEY,
    id: "recommended-42",
    dataSource: "mock",
    travelMinutes: 14,
    route: "42",
    etaMinutes: 3,
  },
  {
    ...ALA_MOANA_JOURNEY,
    id: "route-20",
    dataSource: "mock",
    travelMinutes: 18,
    route: "20",
    scheduledTime: "9:48 AM",
  },
  {
    ...ALA_MOANA_JOURNEY,
    id: "route-a",
    dataSource: "mock",
    travelMinutes: 20,
    route: "A",
    routeHeadsign: "CityExpress! Waikīkī",
    etaMinutes: 8,
  },
  {
    ...ALA_MOANA_JOURNEY,
    id: "route-8",
    dataSource: "mock",
    travelMinutes: 23,
    route: "8",
    routeHeadsign: "Waikīkī - Ala Moana",
    scheduledTime: "9:52 AM",
  },
];

export function getJourneyById(journeyId: string) {
  return JOURNEY_OPTIONS.find((journey) => journey.id === journeyId);
}
