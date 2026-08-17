export interface FavoriteBusDefinition {
  id: string;
  route: string;
  headsign: string;
  stopId: string;
  stopName: string;
}

/** Preview favorites only. Arrival and schedule times always come from the transit API. */
export const FAVORITE_BUS_PRESETS: FavoriteBusDefinition[] = [
  {
    id: "a-437",
    route: "A",
    headsign: "Ahua Lagoon Drive Skyline Station",
    stopId: "437",
    stopName: "S Beretania St + Bishop St",
  },
  {
    id: "1l-437",
    route: "1L",
    headsign: "Halawa Aloha Stadium Stn - Limited Stops",
    stopId: "437",
    stopName: "S Beretania St + Bishop St",
  },
  {
    id: "c-437",
    route: "C",
    headsign: "CountryExpress! Makaha",
    stopId: "437",
    stopName: "S Beretania St + Bishop St",
  },
  {
    id: "51-437",
    route: "51",
    headsign: "Wahiawa Heights",
    stopId: "437",
    stopName: "S Beretania St + Bishop St",
  },
];

export function getFavoriteBusById(
  id: string,
): FavoriteBusDefinition | undefined {
  return FAVORITE_BUS_PRESETS.find((bus) => bus.id === id);
}
