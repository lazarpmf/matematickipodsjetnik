import { contentDisposition, isDropId } from '@/lib/qrDrop';
import { takeDrop } from '@/lib/qrDropStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function gone() {
  return new Response('Fajl više nije dostupan.', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export function GET() {
  return new Response('Fajl se preuzima dugmetom Preuzmi.', {
    status: 405,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      allow: 'POST',
      'cache-control': 'no-store',
    },
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isDropId(id)) return gone();

  const stored = await takeDrop(id);
  if (!stored) return gone();

  return new Response(Buffer.from(stored.bytes), {
    headers: {
      'content-type': stored.meta.contentType,
      'content-disposition': contentDisposition(stored.meta.filename),
      'content-length': String(stored.bytes.byteLength),
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
