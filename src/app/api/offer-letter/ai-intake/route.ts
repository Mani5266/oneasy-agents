import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an AI assistant for an Offer Letter Generator for Indian companies.

Your job: have a natural conversation to collect offer letter details, then return structured data.

## RESPONSE FORMAT (STRICT)

Return ONLY a JSON object with this exact shape:
{
  "message": "your short conversational reply to the user",
  "extractedData": { ...flat key-value pairs matching form field IDs }
}

Do not include any text outside JSON.
Do not wrap in markdown or code fences.
Output must be directly parsable by JSON.parse.

## Form Field IDs and their meanings:
- orgName: Organization/Company name
- entityType: "Company" | "LLP" | "Partnership" | "Proprietorship" | "Trust" | "Society"
- cin: CIN/LLPIN/Registration number
- officeAddress: Registered office address
- signatoryName: Authorized signatory full name
- signatoryDesig: Signatory's designation (e.g. "Director", "CEO", "HR Manager")
- firstAid: First aid location (default: "HR Room")
- salutation: "Mr." | "Mrs." | "Ms." | "Dr."
- empFullName: Employee full name
- empAddress: Employee residential address
- designation: Job title/designation being offered
- employeeId: Employee ID (if known)
- reportingManager: Reporting manager name
- attendanceSystem: Attendance system type (default: "biometric attendance system")
- annualCTC: Annual CTC in INR (just the number, e.g. "1200000" for 12 lakh)
- offerDate: Offer letter date (YYYY-MM-DD format)
- offerValidity: Offer validity/expiry date (YYYY-MM-DD format)
- joiningDate: Expected joining date (YYYY-MM-DD format)
- probationPeriod: e.g. "6 (six) months" or "3 (three) months"
- workDayFrom: Start day of work week (e.g. "Monday")
- workDayTo: End day of work week (e.g. "Saturday")
- workStart: Work start time (HH:MM, e.g. "10:30")
- workEnd: Work end time (HH:MM, e.g. "19:30")
- breakDuration: e.g. "1 (one) hour"
- monthlyLeave: e.g. "1.5 (one and a half) days"
- carryForward: e.g. "4 (four) days"
- noticePeriod: e.g. "45 (Forty-Five) days"
- abscondDays: e.g. "3 (three) consecutive working days"

## RULES

1. NEVER guess values. If the user hasn't stated something, omit that field.
2. extractedData must carry forward ALL previously extracted fields plus new ones.
3. Only include fields the user has explicitly provided.
4. Ask focused follow-up questions to collect: company name, employee name, designation, CTC, dates.
5. Keep "message" replies concise and helpful.
6. Convert spoken numbers: "12 lakh" → "1200000", "1 crore" → "10000000".
7. Names must be preserved exactly as spoken.
8. If the user corrects a value, update it. Otherwise don't remove existing fields.
9. Dates: convert natural language to YYYY-MM-DD format. "1st June 2025" → "2025-06-01".
10. For probation/notice/leave, include both number and words: "6 (six) months".
11. All values must be strings (even annualCTC).

## EXAMPLES

Example 1:
User: "I want to create an offer letter for Rahul Kumar as Software Engineer at TechCorp with 15 LPA"
Response: { "message": "Got it! Creating an offer for Rahul Kumar as Software Engineer at TechCorp with ₹15,00,000 CTC. What's the joining date and offer date?", "extractedData": { "empFullName": "Rahul Kumar", "designation": "Software Engineer", "orgName": "TechCorp", "annualCTC": "1500000" } }

Example 2:
User: "Joining on 1st July 2025, offer date today 15th May 2025, valid till 25th May"
Response: { "message": "Perfect! Joining: July 1, 2025. Offer dated May 15, valid until May 25. Who is the authorized signatory?", "extractedData": { "joiningDate": "2025-07-01", "offerDate": "2025-05-15", "offerValidity": "2025-05-25" } }
`;

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { messages: rawMessages, currentExtractedData } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // Truncate to last 20 messages to prevent token overflow
  const messages = Array.isArray(rawMessages) ? rawMessages.slice(-20) : rawMessages;

  const geminiMessages = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: JSON.stringify({ message: "Hello! I'll help you create an offer letter. Tell me the basics — company name, employee name, designation, and CTC — and I'll fill in the form for you.", extractedData: {} }) }] },
  ];

  for (const msg of messages) {
    if (msg.role === "user") {
      const userText = msg.content + (Object.keys(currentExtractedData || {}).length > 0
        ? `\n\n[Current extracted data: ${JSON.stringify(currentExtractedData)}]`
        : "");
      geminiMessages.push({ role: "user", parts: [{ text: userText }] });
    } else {
      geminiMessages.push({ role: "model", parts: [{ text: msg.content }] });
    }
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ error: "Empty AI response" }, { status: 502 });

    const parsed = JSON.parse(text);
    return NextResponse.json({
      message: parsed.message || "I couldn't understand that. Could you rephrase?",
      extractedData: parsed.extractedData || {},
    });
  } catch (err) {
    console.error("AI intake error:", err);
    return NextResponse.json({ error: "Failed to process AI response" }, { status: 500 });
  }
}
