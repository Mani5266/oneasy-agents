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

    const { html, llpName, agreementId } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html body" }, { status: 400 });
    }

    const safeName = (llpName || "").replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
    const filename = safeName
      ? `LLP_Agreement - ${safeName}.pdf`
      : "LLP_Agreement.pdf";

    const pdfBuffer = await generatePdfFromHtml(stripScripts(html));

    // Upload to Supabase Storage
    if (agreementId) {
      const storagePath = `${user.id}/${agreementId}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("llp-docs")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        // Store PDF URL in agreement record
        await supabase
          .from("llp_form_agreements")
          .update({ pdf_url: storagePath })
          .eq("id", agreementId)
          .eq("user_id", user.id)
          .is("deleted_at", null);
      } else {
        console.error("[llp-form/generate-pdf] Storage upload error:", uploadError);
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
    console.error("[llp-form/generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
