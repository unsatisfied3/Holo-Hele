/** True when a real TheBus API key is configured on the server. */
export function isTheBusApiKeyConfigured(): boolean {
  const key = process.env.THEBUS_API_KEY?.trim();
  return Boolean(key);
}

export function getTheBusApiKey(): string | undefined {
  if (!isTheBusApiKeyConfigured()) return undefined;
  return process.env.THEBUS_API_KEY!.trim();
}
