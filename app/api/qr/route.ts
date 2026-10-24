import { NextResponse } from 'next/server';
import {
  MAX_DROP_BYTES,
  dropTtlMs,
  isDropId,
  publicOrigin,
  safeContentType,
  sanitizeFilename,
} from '@/lib/qrDrop';
import { saveDrop } from '@/lib/qrDropStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Fajl nije stigao. Probaj ponovo.' },
      { status: 400 },
    );
  }

  const id = form.get('id');
  const sender = form.get('sender');
  if (typeof id !== 'string' || !isDropId(id)) {
    return NextResponse.json({ error: 'Link nije ispravan.' }, { status: 400 });
  }
  if (typeof sender !== 'string' || !isDropId(sender)) {
    return NextResponse.json({ error: 'Pošiljalac nije ispravan.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Izaberi fajl.' }, { status: 400 });
  }
  if (file.size > MAX_DROP_BYTES) {
    return NextResponse.json(
      { error: 'Fajl je veći od 5 MB.' },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_DROP_BYTES) {
    return NextResponse.json(
      { error: 'Fajl je veći od 5 MB.' },
      { status: 413 },
    );
  }

  const createdAt = Date.now();
  const meta = {
    filename: sanitizeFilename(file.name),
    contentType: safeContentType(file.type),
    size: bytes.byteLength,
    createdAt,
    sender,
  };

  try {
    const saved = await saveDrop(id, bytes, meta);
    if (!saved) {
      return NextResponse.json(
        { error: 'Već čeka jedan fajl. Prvo ga preuzmi.' },
        { status: 409 },
      );
    }
  } catch (error) {
    console.error('QR Drop save failed', error);
    return NextResponse.json(
      { error: 'Fajl nije sačuvan. Probaj ponovo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id,
    url: `${publicOrigin(request)}/qr/${id}`,
    filename: meta.filename,
    size: meta.size,
    expiresAt: createdAt + dropTtlMs(),
  });
}
