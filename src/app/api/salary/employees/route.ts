import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/features/salary/lib/services/supabase";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  try {
    const client = await getSupabaseClient();
    if (!client) {
      return NextResponse.json([]);
    }
    const { data } = await client
      .from("salary_employees")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch employees";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}

// Sanitize employee data: convert empty strings to null for optional fields
function sanitizeEmployeeData(body: Record<string, unknown>) {
  const optionalFields = ["email", "employee_code", "designation", "department", "date_of_joining"];
  const sanitized = { ...body };
  for (const field of optionalFields) {
    if (sanitized[field] === "") {
      sanitized[field] = null;
    }
  }
  return sanitized;
}

export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  try {
    const client = await getSupabaseClient();
    const body = await request.json();
    const sanitized = sanitizeEmployeeData(body);

    if (!client) {
      // Return mock response with generated ID if no Supabase
      return NextResponse.json({ id: crypto.randomUUID(), ...sanitized, created_at: new Date().toISOString() });
    }

    const { data, error } = await client
      .from("salary_employees")
      .insert(sanitized)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Failed to save employee";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  try {
    const client = await getSupabaseClient();
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ detail: "Employee ID is required" }, { status: 400 });
    }

    const updates = sanitizeEmployeeData(rest);

    if (!client) {
      return NextResponse.json({ id, ...updates, updated_at: new Date().toISOString() });
    }

    const { data, error } = await client
      .from("salary_employees")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Failed to update employee";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  try {
    const client = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ detail: "Employee ID is required" }, { status: 400 });
    }

    if (!client) {
      return NextResponse.json({ success: true });
    }

    const { error } = await client.from("salary_employees").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete employee";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
