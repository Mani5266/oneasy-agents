/**
 * Cross-feature AI usage limiter (Phase 5: cost controls).
 *
 * Two layers of protection, both backed by Upstash Redis:
 *   1. Daily cap: total AI calls per user per 24h across ALL features
 *      (networth + partnership + llp + llp-form + offer-letter combined).
 *      Default 100/day, override with AI_USAGE_DAILY_LIMIT env var.
 *   2. Per-route hourly limiters for routes that don't already have a
 *      feature-level rate limiter (currently llp-form/ai-intake,
 *      offer-letter/ai-intake, and llp/chat — which today uses an
 *      in-memory IP-keyed limiter we want to replace with Redis+user ID).
 *
 * Graceful degradation: if Upstash env vars are missing the limiters
 * become no-ops and log a warning in production. Local dev keeps working
 * without Redis.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!isConfigured) return null;
  if (_redis) return _redis;
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
}

type LimiterWindow = "1 m" | "1 h" | "1 d";

interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function makeLimiter(prefix: string, requests: number, window: LimiterWindow) {
  const redis = getRedis();

  if (!redis) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `\n⚠️  [ai-usage-limiter] "${prefix}" is a NO-OP — Upstash env vars missing. OK locally, MUST be set in production.\n`
      );
    }
    return {
      check: async (_id: string): Promise<LimitResult> => {
        if (process.env.NODE_ENV === "production") {
          console.warn(
            `[ai-usage-limiter] "${prefix}" disabled in production — UPSTASH_REDIS_REST_URL/TOKEN missing.`
          );
        }
        const windowMs =
          window === "1 d" ? 86_400_000 : window === "1 h" ? 3_600_000 : 60_000;
        return {
          success: true,
          limit: requests,
          remaining: requests,
          reset: Date.now() + windowMs,
        };
      },
    };
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `oneasy:${prefix}`,
    analytics: true,
  });

  return {
    check: async (id: string): Promise<LimitResult> => {
      const result = await limiter.limit(id);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    },
  };
}

// ─── Daily cap (cross-feature) ───────────────────────────────────────────────

const DAILY_LIMIT = Number(process.env.AI_USAGE_DAILY_LIMIT) || 100;
const dailyAiLimiter = makeLimiter("ai-usage:daily", DAILY_LIMIT, "1 d");

export async function checkDailyAiUsage(userId: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}> {
  const result = await dailyAiLimiter.check(`user:${userId}`);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}

export function dailyAiUsageResponse(limit: number, resetAt: number): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const hoursLeft = Math.max(1, Math.ceil(retryAfterSec / 3600));
  return NextResponse.json(
    {
      success: false,
      error: `Daily AI limit reached (${limit} requests/day). Try again in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

// ─── Per-route hourly limiters for routes without feature-level limiters ────

export const llpFormAiIntakeRateLimit = makeLimiter("ratelimit:llp-form:ai-intake", 30, "1 h");
export const offerLetterAiIntakeRateLimit = makeLimiter("ratelimit:offer-letter:ai-intake", 30, "1 h");
export const llpChatRateLimit = makeLimiter("ratelimit:llp:chat", 30, "1 h");

export function rateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}

/**
 * Identifier helper — prefers authenticated user ID over IP.
 * Uses rightmost X-Forwarded-For (trusted-proxy edge) when falling back.
 */
export function getUserIdentifier(request: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    const lastIp = ips[ips.length - 1];
    if (lastIp) return `ip:${lastIp}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "ip:unknown";
}
