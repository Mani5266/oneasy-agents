import { NextRequest, NextResponse } from "next/server";
import { geminiJSON } from "@/features/llp/lib/gemini";
import { buildPrompt, buildSingleCardPrompt, buildExtractionResponse, AIReply, SingleCardExtraction } from "@/features/llp/lib/prompts";
import { validateUpdates } from "@/features/llp/lib/validation";
import { chatInputSchema } from "@/features/llp/lib/schemas";
import {
  llpChatRateLimit,
  checkDailyAiUsage,
  dailyAiUsageResponse,
  rateLimitResponse,
  getUserIdentifier,
} from "@/lib/ai-usage-limiter";
import { createSupabaseServerClient } from "@/features/llp/lib/supabase-server";

export async function POST(req: NextRequest) {
  // ── AUTH CHECK ──
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Per-route hourly rate limit (30/hr per user — Redis-backed, user-keyed)
  const identifier = getUserIdentifier(req, user.id);
  const rl = await llpChatRateLimit.check(identifier);
  if (!rl.success) return rateLimitResponse(rl.reset);

  // Daily cross-feature AI cap (100/day per user by default)
  const daily = await checkDailyAiUsage(user.id);
  if (!daily.allowed) return dailyAiUsageResponse(daily.limit, daily.resetAt);

  try {
    // Zod validation on incoming request body
    const body = await req.json();
    const parsed = chatInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          message: "Invalid request. Please check your input and try again.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { message, data, step, files } = parsed.data;
    const hasFiles = files && files.length > 0;

    let result: AIReply;

    if (hasFiles) {
      // ── Per-card extraction: process each Aadhaar card individually ──
      const cardPrompt = buildSingleCardPrompt();

      const extractions = await Promise.all(
        files.map(async (file, idx) => {
          try {
            const ext = await geminiJSON<SingleCardExtraction>(
              cardPrompt,
              [file]
            );
            console.log(`[ocr] Card ${idx + 1} extraction:`, JSON.stringify(ext));
            return ext;
          } catch (err) {
            console.error(`[ocr] Card ${idx + 1} extraction failed:`, err);
            return {
              fullName: "",
              salutation: "Mr.",
              relationDescriptor: "S/O",
              fatherSalutation: "Mr.",
              fatherName: "",
              dob: "",
              aadhaarAddress: "",
            } as SingleCardExtraction;
          }
        })
      );

      result = buildExtractionResponse(extractions, data.numPartners || files.length);
    } else {
      // ── Normal conversational flow ──
      const prompt = buildPrompt(message, data, step);
      result = await geminiJSON<AIReply>(prompt);
    }

    // Server-side validation on AI-provided updates
    if (result.updates && Object.keys(result.updates).length > 0) {
      const errors = validateUpdates(result.updates);
      if (errors.length > 0) {
        result.validationError = errors.join(" ");
        result.message = `\u26a0\ufe0f ${errors.join(" ")}\n\n${result.message}`;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("chat error:", err);
    const errorMessage = "Sorry, I had trouble processing that. Please try again.";
    return NextResponse.json({
      message: errorMessage,
      validationError: err instanceof Error ? err.message : "error",
      suggestedOptions: [],
      suggestedCheckboxes: [],
    }, { status: 500 });
  }
}
