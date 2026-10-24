import { NextResponse } from 'next/server';
import {
  MAX_DROP_BYTES,
  dropTtlMs,
  publicOrigin,
  safeContentType,
  sanitizeFilename,
} from '@/lib/qrDrop';
import { createDropId, saveDrop } from '@/lib/qrDropStore';

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

  const id = createDropId();
  const createdAt = Date.now();
  const meta = {
    filename: sanitizeFilename(file.name),
    contentType: safeContentType(file.type),
    size: bytes.byteLength,
    createdAt,
  };

  try {
    await saveDrop(id, bytes, meta);
  } catch (error) {
    console.error('QR Drop save failed', error);
    return NextResponse.json(
      { error: 'Fajl nije sačuvan. Probaj ponovo.' },
      { status: 500 },
    );
  }

  const url = `${publicOrigin(request)}/qr/${id}`;
  return NextResponse.json({
    id,
    url,
    filename: meta.filename,
    size: meta.size,
    expiresAt: createdAt + dropTtlMs(),
  });
}
