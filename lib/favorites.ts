import { useEffect, useState } from "react";

const FAVORITE_STOPS_KEY = "holo-hele-favorite-stops";
const FAVORITE_BUSES_KEY = "holo-hele-favorite-buses";
const FAVORITES_CHANGED_EVENT = "holo-hele-favorites-changed";
const DEFAULT_FAVORITE_STOP_IDS = ["1280", "437", "45", "1619"];
const DEFAULT_FAVORITE_BUS_IDS = ["a-437", "1l-437", "c-437", "51-437"];

function readIds(key: string, defaults: string[]): string[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(key);
    if (stored == null) return defaults;
    const value = JSON.parse(stored) as unknown;
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : defaults;
  } catch {
    return defaults;
  }
}

export function getFavoriteStopIds(): string[] {
  return readIds(FAVORITE_STOPS_KEY, DEFAULT_FAVORITE_STOP_IDS);
}

function saveFavoriteStopIds(ids: string[]): void {
  window.localStorage.setItem(FAVORITE_STOPS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function getFavoriteBusIds(): string[] {
  return readIds(FAVORITE_BUSES_KEY, DEFAULT_FAVORITE_BUS_IDS);
}

function saveFavoriteBusIds(ids: string[]): void {
  window.localStorage.setItem(FAVORITE_BUSES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function toggleFavoriteBus(busId: string): boolean {
  const ids = getFavoriteBusIds();
  const isFavorite = ids.includes(busId);
  saveFavoriteBusIds(
    isFavorite ? ids.filter((id) => id !== busId) : [...ids, busId],
  );
  return !isFavorite;
}

export function removeFavoriteBus(busId: string): void {
  saveFavoriteBusIds(getFavoriteBusIds().filter((id) => id !== busId));
}

export function isFavoriteStop(stopId: string): boolean {
  return getFavoriteStopIds().includes(stopId);
}

export function toggleFavoriteStop(stopId: string): boolean {
  const ids = getFavoriteStopIds();
  const isFavorite = ids.includes(stopId);
  saveFavoriteStopIds(
    isFavorite ? ids.filter((id) => id !== stopId) : [...ids, stopId],
  );
  return !isFavorite;
}

export function removeFavoriteStop(stopId: string): void {
  saveFavoriteStopIds(getFavoriteStopIds().filter((id) => id !== stopId));
}

export function useFavoriteStopIds(): string[] {
  const [ids, setIds] = useState<string[]>(getFavoriteStopIds);

  useEffect(() => {
    const sync = () => setIds(getFavoriteStopIds());
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
    };
  }, []);

  return ids;
}

export function useFavoriteBusIds(): string[] {
  const [ids, setIds] = useState<string[]>(getFavoriteBusIds);

  useEffect(() => {
    const sync = () => setIds(getFavoriteBusIds());
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
    };
  }, []);

  return ids;
}
