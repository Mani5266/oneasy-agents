import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// ─── Configuration ────────────────────────────────────────────────────────────

const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

function getRedis(): Redis | null {
  if (!isConfigured) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────

export const ocrRateLimit = createLimiter("partnership:ocr", {
  requests: 20,
  window: "1 h",
});

export const generateRateLimit = createLimiter("partnership:generate", {
  requests: 10,
  window: "1 h",
});

export const objectiveRateLimit = createLimiter("partnership:objective", {
  requests: 20,
  window: "1 h",
});

export const suggestNamesRateLimit = createLimiter("partnership:suggest-names", {
  requests: 20,
  window: "1 h",
});

export const aiIntakeRateLimit = createLimiter("partnership:ai-intake", {
  requests: 30,
  window: "1 h",
});

export const sttRateLimit = createLimiter("partnership:stt", {
  requests: 30,
  window: "1 h",
});

// ─── Factory ──────────────────────────────────────────────────────────────────

interface LimiterConfig {
  requests: number;
  window: "1 h" | "1 m" | "1 d";
}

export function createLimiter(prefix: string, config: LimiterConfig) {
  const redis = getRedis();

  if (!redis) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `\n[ratelimit] Limiter "${prefix}" is a NO-OP — Upstash env vars missing.\n`
      );
    }

    return {
      check: async (_identifier: string) => {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            `[SECURITY] Rate limiter "${prefix}" disabled — UPSTASH env vars must be set in production.`
          );
        }
        return {
          success: true as const,
          limit: config.requests,
          remaining: config.requests,
          reset: Date.now() + 3600_000,
        };
      },
    };
  }

  const windowMs =
    config.window === "1 h"
      ? "1 h"
      : config.window === "1 m"
        ? "1 m"
        : "1 d";

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, windowMs),
    prefix: `oneasy:ratelimit:${prefix}`,
    analytics: true,
  });

  return {
    check: async (identifier: string) => {
      const result = await limiter.limit(identifier);
      return result;
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getClientIdentifier(
  request: Request,
  userId?: string | null
): string {
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "ip:unknown";
}

export function rateLimitResponse(resetTimestamp: number): NextResponse {
  const retryAfterSeconds = Math.ceil(
    (resetTimestamp - Date.now()) / 1000
  );

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
        "X-RateLimit-Reset": String(resetTimestamp),
      },
    }
  );
}
