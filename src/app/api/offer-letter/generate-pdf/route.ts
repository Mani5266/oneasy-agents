import { NextRequest, NextResponse } from "next/server";
import { generatePdfFromHtml, resetBrowser } from "@/lib/puppeteer";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function stripScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/on\w+\s*=\s*"[^"]*"/gi, "").replace(/on\w+\s*=\s*'[^']*'/gi, "");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { html, empName, offerId } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html body" }, { status: 400 });
    }

    const safeName = (empName || "").replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
    const filename = safeName
      ? `Offer_Letter - ${safeName}.pdf`
      : "Offer_Letter.pdf";

    const pdfBuffer = await generatePdfFromHtml(stripScripts(html));

    // Upload to Supabase Storage
    if (offerId) {
      const storagePath = `${user.id}/${offerId}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("offerletter-docs")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        // Store PDF URL in offer record
        await supabase
          .from("offerletter_offers")
          .update({ pdf_url: storagePath })
          .eq("id", offerId)
          .eq("user_id", user.id);
      } else {
        console.error("[offer-letter/generate-pdf] Storage upload error:", uploadError);
      }
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    resetBrowser();
    console.error("[offer-letter/generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
