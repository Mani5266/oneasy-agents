import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDoc } from '@/features/offer-letter/lib/docGenerator';
import { validateGeneratePayload } from '@/features/offer-letter/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateGeneratePayload(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const validatedData = validation.data!;
    const buffer = await generateDoc(validatedData);

    const empName = (validatedData.empFullName || 'Letter').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Letter';
    const filename = `Offer_${empName}.docx`;

    // Upload to Supabase Storage
    const offerId = (body as Record<string, unknown>)._offerId as string || 'unknown';
    const storagePath = `offers/${offerId}/${filename}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('offer-docs')
        .upload(storagePath, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true,
        });

      if (!uploadError && offerId !== 'unknown') {
        await supabase
          .from('offerletter_offers')
          .update({ doc_url: storagePath })
          .eq('id', offerId);
      }
    } catch {
      // Storage upload failed — still return the DOCX
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('DocGen Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
