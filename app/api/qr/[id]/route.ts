import { NextResponse } from 'next/server';
import { dropTtlMs, isDropId } from '@/lib/qrDrop';
import { peekDrop } from '@/lib/qrDropStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isDropId(id)) {
    return NextResponse.json({ error: 'Link nije ispravan.' }, { status: 404 });
  }

  const meta = await peekDrop(id);
  const from = new URL(request.url).searchParams.get('from') ?? '';
  return NextResponse.json(
    {
      file: meta
        ? {
            filename: meta.filename,
            size: meta.size,
            createdAt: meta.createdAt,
            expiresAt: meta.createdAt + dropTtlMs(),
            mine: meta.sender !== '' && meta.sender === from,
          }
        : null,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
