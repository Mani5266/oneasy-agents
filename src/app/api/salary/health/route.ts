import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/features/salary/lib/services/supabase";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "2.0.0",
    runtime: "next.js",
    supabase_configured: isSupabaseConfigured(),
  });
}
