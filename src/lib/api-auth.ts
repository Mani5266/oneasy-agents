import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Require authentication for an API route.
 * Returns the user if authenticated, or a 401 response.
 */
export async function requireAuth(): Promise<
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          { success: false, error: "Authentication required." },
          { status: 401 }
        ),
      };
    }

    return { user: { id: user.id, email: user.email ?? undefined }, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Authentication failed." },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verify a cron secret for protected cron endpoints.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no cron secret configured, block in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Cron endpoint not configured." },
        { status: 403 }
      );
    }
    return null; // Allow in dev
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  return null;
}
