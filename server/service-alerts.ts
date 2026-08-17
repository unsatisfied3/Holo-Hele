import type {
  ServiceAlertsResponse,
  TransitAlert,
  TransitAlertType,
} from "@/types/transit";

export const THEBUS_SERVICE_DISRUPTION_URL =
  "https://www.thebus.org/Updates/ServiceDisruption.asp?l=eng";
export const SERVICE_ALERT_CACHE_MS = 5 * 60 * 1000;

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const ENTRY_START =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(am|pm))?\s*[-–—]\s*(.+)$/i;
const ROUTE_LINE = /^Route\(s\)\s+(.+?)\.?$/i;

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#")) {
      const hexadecimal = code[1]?.toLocaleLowerCase() === "x";
      const number = Number.parseInt(
        code.slice(hexadecimal ? 2 : 1),
        hexadecimal ? 16 : 10,
      );
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return named[code.toLocaleLowerCase()] ?? entity;
  });
}

export function serviceDisruptionHtmlToLines(html: string): string[] {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<(?:br|\/p|\/div|\/li|\/tr|\/td|\/h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\u0096\u2013\u2014]/g, "-")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeRoutes(value: string): string[] {
  const routes = value
    .replace(/\.$/, "")
    .split(/[,;/]|\band\b/i)
    .map((route) => route.trim().toLocaleUpperCase().replace(/\s+LINE$/, ""))
    .filter((route) => /^[A-Z0-9]+$/.test(route));
  return [...new Set(routes)];
}

function extractAffectedStops(description: string): string[] {
  const affectedClause = description.split(
    /\b(?:please\s+board|passengers?\s+may\s+board|use\s+(?:the\s+)?alternative|alternative\s+stop)\b/i,
  )[0];
  const matches = affectedClause.matchAll(/\b(?:bus\s+)?stop\s*#?\s*(\d{1,6})\b/gi);
  return [...new Set([...matches].map((match) => match[1]))];
}

function getAlertType(title: string): TransitAlertType {
  const normalized = title.toLocaleLowerCase();
  if (normalized.includes("bus stop closure")) return "stop-closure";
  if (normalized.includes("detour")) return "detour";
  if (normalized.includes("road work") || normalized.includes("construction")) {
    return "roadwork";
  }
  if (normalized.includes("service change")) return "service-change";
  if (normalized.includes("disruption") || normalized.includes("closure")) {
    return "service-disruption";
  }
  return "other";
}

function isSystemWide(title: string, description: string): boolean {
  return /\b(?:all routes|system[- ]wide|entire system|all service)\b/i.test(
    `${title} ${description}`,
  );
}

function parseStartTime(match: RegExpMatchArray): string | undefined {
  const month = MONTHS[match[1].toLocaleLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month == null || !Number.isInteger(day) || !Number.isInteger(year)) {
    return undefined;
  }

  let hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const meridiem = match[6]?.toLocaleLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return new Date(Date.UTC(year, month, day, hour + 10, minute)).toISOString();
}

function stableAlertId(parts: string[]): string {
  const input = parts.join("|").normalize("NFKC").toLocaleLowerCase();
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `thebus-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function parseServiceDisruptionLines(lines: string[]): TransitAlert[] {
  const alerts: TransitAlert[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const headingMatch = lines[index].match(ENTRY_START);
    if (!headingMatch) continue;

    const heading = lines[index];
    const title = headingMatch[7].trim();
    const bodyLines: string[] = [];
    let routeLine: string | undefined;
    let cursor = index + 1;

    while (
      cursor < lines.length &&
      !ENTRY_START.test(lines[cursor]) &&
      !/^(?:Procurement|Transit Center|Road Conditions|©)/i.test(lines[cursor])
    ) {
      const routeMatch = lines[cursor].match(ROUTE_LINE);
      if (routeMatch && routeLine == null) routeLine = routeMatch[1];
      else bodyLines.push(lines[cursor]);
      cursor += 1;
    }

    index = cursor - 1;
    const description = bodyLines.join(" ").trim();
    if (!title || !description) continue;

    const affectedRoutes = routeLine ? normalizeRoutes(routeLine) : [];
    const systemWide = isSystemWide(title, description);
    const affectedStops = extractAffectedStops(description);
    const startTime = parseStartTime(headingMatch);
    const type = getAlertType(title);

    alerts.push({
      id: stableAlertId([
        title,
        affectedRoutes.join(","),
        affectedStops.join(","),
        startTime ?? heading,
        description.slice(0, 180),
        THEBUS_SERVICE_DISRUPTION_URL,
      ]),
      title,
      description,
      affectedRoutes,
      affectedStops,
      systemWide,
      startTime,
      type,
      severity: systemWide ? "critical" : "warning",
      source: "thebus-live",
      sourceUrl: THEBUS_SERVICE_DISRUPTION_URL,
      isLive: true,
    });
  }

  return alerts;
}

export function parseServiceDisruptionHtml(html: string): TransitAlert[] {
  return parseServiceDisruptionLines(serviceDisruptionHtmlToLines(html));
}

interface AlertCacheEntry {
  alerts: TransitAlert[];
  fetchedAt: string;
  expiresAt: number;
}

type AlertFetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function createServiceAlertService({
  fetcher = fetch,
  now = Date.now,
  cacheMs = SERVICE_ALERT_CACHE_MS,
}: {
  fetcher?: AlertFetcher;
  now?: () => number;
  cacheMs?: number;
} = {}) {
  let cache: AlertCacheEntry | null = null;

  return async function getServiceAlerts(): Promise<ServiceAlertsResponse> {
    const timestamp = now();
    if (cache && timestamp < cache.expiresAt) {
      return {
        alerts: cache.alerts,
        fetchedAt: cache.fetchedAt,
        sourceUrl: THEBUS_SERVICE_DISRUPTION_URL,
        status: "live",
        cached: true,
      };
    }

    try {
      const response = await fetcher(THEBUS_SERVICE_DISRUPTION_URL, {
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`TheBus returned ${response.status}.`);

      const html = await response.text();
      if (!/Service\s+Disruption/i.test(html)) {
        throw new Error("TheBus alert page format was not recognized.");
      }

      const alerts = parseServiceDisruptionHtml(html);
      const fetchedAt = new Date(timestamp).toISOString();
      cache = { alerts, fetchedAt, expiresAt: timestamp + cacheMs };
      return {
        alerts,
        fetchedAt,
        sourceUrl: THEBUS_SERVICE_DISRUPTION_URL,
        status: "live",
        cached: false,
      };
    } catch {
      if (cache) {
        return {
          alerts: cache.alerts,
          fetchedAt: cache.fetchedAt,
          sourceUrl: THEBUS_SERVICE_DISRUPTION_URL,
          status: "stale",
          cached: true,
          error:
            "TheBus alerts could not be refreshed. Last available alerts are shown.",
        };
      }

      return {
        alerts: [],
        fetchedAt: new Date(timestamp).toISOString(),
        sourceUrl: THEBUS_SERVICE_DISRUPTION_URL,
        status: "unavailable",
        cached: false,
        error: "Service alerts are temporarily unavailable. Try again later.",
      };
    }
  };
}

export const getServiceAlerts = createServiceAlertService();
