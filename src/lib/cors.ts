import { NextResponse } from "next/server";

/**
 * CORS allowlist for API routes.
 * Only origins in this list are allowed for cross-origin requests.
 */
const ALLOWED_ORIGINS = [
  "https://www.getnetworthcertificate.com",
  "https://getnetworthcertificate.com",
  "https://oneasy-agents.vercel.app",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://localhost:3010"]
    : []),
];

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With";

/**
 * Returns the request's Origin header if it's in the allowlist, otherwise null.
 */
export function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

/**
 * Builds a CORS headers object based on the request's origin.
 * Returns empty headers if the origin is not allowed (browser will block).
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = getAllowedOrigin(request);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Standard handler for CORS preflight (OPTIONS) requests.
 * Use in API routes that need to accept cross-origin requests.
 *
 * Example:
 *   export const OPTIONS = corsPreflight;
 */
export function corsPreflight(request: Request): NextResponse {
  const headers = corsHeaders(request);
  if (Object.keys(headers).length === 0) {
    // Origin not allowed
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers });
}

/**
 * Wraps a NextResponse with CORS headers.
 *
 * Example:
 *   return withCors(NextResponse.json({ data }), request);
 */
export function withCors(response: NextResponse, request: Request): NextResponse {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Validates that a same-origin or allowed-origin request is being made.
 * Returns null if valid, or a 403 NextResponse if origin is disallowed.
 *
 * Same-origin requests (no Origin header, or Origin matches Host) are always allowed.
 * Cross-origin requests must come from an allowlisted origin.
 *
 * Use in mutating API routes (POST/PUT/DELETE) as a lightweight CSRF check.
 */
export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");

  // Same-origin requests (no Origin header) are always allowed
  if (!origin) return null;

  // Cross-origin: must be in allowlist
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: "Forbidden: origin not allowed" },
      { status: 403 }
    );
  }

  return null;
}
