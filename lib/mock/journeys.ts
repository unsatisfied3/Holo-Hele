export interface SearchBusResult {
  id: string;
  route: string;
  name: string;
  detail: string;
  routePreviewId?: string;
}

export interface SearchPlaceResult {
  id: string;
  name: string;
  address: string;
}

export interface JourneyOption {
  id: string;
  travelMinutes: number;
  walkStartMinutes: number;
  route: string;
  etaMinutes?: number;
  scheduledTime?: string;
  walkEndMinutes?: number;
}

export const SEARCH_BUSES: SearchBusResult[] = [
  {
    id: "bus-a",
    route: "A",
    name: "A - CityExpress! U.H. Manoa",
    detail: "Kaoonohi St + Moanalua Lp → Sinclair Circle",
  },
  {
    id: "bus-8",
    route: "1L",
    name: "1L - Hawaiʻi Kai - Limited Stops",
    detail: "Hālawa Aloha Stadium Station → Hawaiʻi Kai",
    routePreviewId: "1l-hawaii-kai",
  },
];

export const SEARCH_PLACES: SearchPlaceResult[] = [
  {
    id: "ala-moana-center",
    name: "Ala Moana Center",
    address: "1450 Ala Moana Blvd, Honolulu, HI 96814",
  },
  {
    id: "ala-moana-beach",
    name: "Ala Moana Beach Park",
    address: "1201 Ala Moana Blvd, Honolulu, HI 96814",
  },
  {
    id: "ala-wai-canal",
    name: "Ala Wai Canal",
    address: "Ala Wai Blvd, Honolulu, HI 96815",
  },
];

export const JOURNEY_OPTIONS: JourneyOption[] = [
  {
    id: "recommended-a",
    travelMinutes: 14,
    walkStartMinutes: 5,
    route: "A",
    etaMinutes: 8,
  },
  {
    id: "route-4",
    travelMinutes: 16,
    walkStartMinutes: 9,
    route: "4",
    scheduledTime: "10:05 PM",
  },
  {
    id: "route-c",
    travelMinutes: 30,
    walkStartMinutes: 12,
    route: "C",
    scheduledTime: "10:05 PM",
    walkEndMinutes: 5,
  },
  {
    id: "route-a-19",
    travelMinutes: 19,
    walkStartMinutes: 5,
    route: "A",
    etaMinutes: 8,
  },
];
