export function publicOriginFromHeaders(requestHeaders: Headers) {
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))?.split(",")[0]?.trim();
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  return host ? `${protocol}://${host}` : undefined;
}

export function publicProfileUrl(slug: string, requestOrigin?: string) {
  const baseUrl = (requestOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/${encodeURIComponent(slug)}`;
}
