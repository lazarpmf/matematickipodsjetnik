import { NextResponse } from 'next/server';
import { dropTtlMs, isDropId } from '@/lib/qrDrop';
import { peekDrop } from '@/lib/qrDropStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isDropId(id)) {
    return NextResponse.json({ error: 'Fajl više nije dostupan.' }, { status: 404 });
  }

  const meta = await peekDrop(id);
  if (!meta) {
    return NextResponse.json({ error: 'Fajl više nije dostupan.' }, { status: 404 });
  }

  return NextResponse.json(
    {
      filename: meta.filename,
      size: meta.size,
      contentType: meta.contentType,
      createdAt: meta.createdAt,
      expiresAt: meta.createdAt + dropTtlMs(),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
