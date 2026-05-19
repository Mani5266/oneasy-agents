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

    const { html, candidateName, certificateId } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html body" }, { status: 400 });
    }

    const safeName = (candidateName || "").replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
    const filename = safeName
      ? `NetWorth_Certificate - ${safeName}.pdf`
      : "NetWorth_Certificate.pdf";

    const pdfBuffer = await generatePdfFromHtml(stripScripts(html));

    // Upload to Supabase Storage
    if (certificateId) {
      const storagePath = `${user.id}/${certificateId}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("networth-documents")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("networth-documents")
          .getPublicUrl(storagePath);

        // Store PDF URL in certificate record
        await supabase
          .from("networth_certificates")
          .update({ pdf_url: urlData.publicUrl })
          .eq("id", certificateId)
          .eq("user_id", user.id);
      } else {
        console.error("[networth/generate-pdf] Storage upload error:", uploadError);
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
    console.error("[generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
