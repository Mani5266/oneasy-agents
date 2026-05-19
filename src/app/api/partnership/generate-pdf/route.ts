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

    const { html, businessName, deedId } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html body" }, { status: 400 });
    }

    const safeName = (businessName || "").replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
    const filename = safeName
      ? `Partnership_Deed - ${safeName}.pdf`
      : "Partnership_Deed.pdf";

    const pdfBuffer = await generatePdfFromHtml(stripScripts(html));

    // Upload to Supabase Storage
    if (deedId) {
      const storagePath = `${user.id}/${deedId}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("partnership-docs")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        // Insert/update partnership_documents record
        await supabase
          .from("partnership_documents")
          .insert({
            deed_id: deedId,
            user_id: user.id,
            file_url: storagePath,
            file_name: filename,
            file_type: "application/pdf",
          });
      } else {
        console.error("[partnership/generate-pdf] Storage upload error:", uploadError);
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
    console.error("[partnership/generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
