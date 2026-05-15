import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an AI assistant for an LLP (Limited Liability Partnership) Agreement generator in India.

Your job: have a natural conversation to collect LLP details, then return structured data matching the LLPData schema below.

## RESPONSE FORMAT (STRICT)

Return ONLY a JSON object with this exact shape:
{
  "message": "your short conversational reply to the user",
  "extractedData": { ...accumulated Partial<LLPData> }
}

Do not include any text outside JSON.
Do not wrap in markdown or code fences.
Output must be directly parsable by JSON.parse.

## LLPData Schema:
{
  numPartners: number (2-10),
  partners: [{
    index: number,
    salutation: "Mr." | "Mrs." | "Ms." | "Dr.",
    fullName: string,
    relationDescriptor: "S/O" | "D/O" | "W/O" | "C/O",
    fatherSalutation: "Mr." | "Mrs." | "Ms." | "Dr.",
    fatherName: string,
    dob: string (DD/MM/YYYY),
    age: string,
    address: { doorNo, area, city, district, state, pin },
    isManagingPartner: boolean,
    isBankAuthorised: boolean,
    isDesignatedPartner: boolean
  }],
  llpName: string,
  executionCity: string,
  executionDate: string (e.g. "12th May, 2025"),
  registeredAddress: { doorNo, area, district, state, pin },
  totalCapital: number,
  contributions: [{ partnerIndex, percentage, amount }],
  profits: [{ partnerIndex, percentage }],
  businessObjectives: string,
  otherPoints: string,
  bankAuthority: "Single" | "Any Two" | "All",
  remunerationType: "Fixed" | "Percentage" | "None",
  remunerationValue: string,
  loansEnabled: boolean,
  loanInterestRate: number,
  arbitrationCity: string
}

## RULES

1. NEVER guess values. If the user hasn't stated something, omit that field.
2. extractedData must carry forward ALL previously extracted fields plus new ones.
3. Only include fields the user has explicitly provided.
4. Ask focused follow-up questions (LLP name, partners, capital, business objectives).
5. Keep "message" replies concise and helpful.
6. Convert spoken numbers: "10 lakh" → 1000000, "1 crore" → 10000000.
7. Names must be preserved exactly as spoken.
8. If the user corrects a value, update it. Otherwise don't remove existing fields.
9. For partners array, maintain the correct index for each partner.
10. When user mentions percentages for profit/contribution, create the proper array entries.

## EXAMPLES

Example 1:
User: "We want to start an IT consulting LLP called TechVista LLP with 2 partners"
Response: { "message": "Great! TechVista LLP with 2 partners. What are the partners' names?", "extractedData": { "llpName": "TechVista LLP", "numPartners": 2, "businessObjectives": "IT consulting" } }

Example 2:
User: "Partner 1 is Mr. Rahul Sharma, S/O Mr. Suresh Sharma, age 35, living at 123 MG Road, Andheri, Mumbai, Maharashtra 400058"
Response: { "message": "Got it! Rahul Sharma's details are recorded. What about the second partner?", "extractedData": { "partners": [{ "index": 0, "salutation": "Mr.", "fullName": "Rahul Sharma", "relationDescriptor": "S/O", "fatherSalutation": "Mr.", "fatherName": "Suresh Sharma", "age": "35", "address": { "doorNo": "123", "area": "MG Road, Andheri", "city": "Mumbai", "district": "Mumbai", "state": "Maharashtra", "pin": "400058" }, "isDesignatedPartner": true, "isManagingPartner": true, "isBankAuthorised": true }] } }
`;

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { messages, currentExtractedData } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // Build Gemini messages
  const geminiMessages = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: JSON.stringify({ message: "Hello! I'll help you create your LLP Agreement. Let's start — what is the name of your LLP and how many partners will there be?", extractedData: {} }) }] },
  ];

  // Add conversation history
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
