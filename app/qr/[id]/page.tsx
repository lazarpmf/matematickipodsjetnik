import type { Metadata } from 'next';
import { formatBytes, isDropId } from '@/lib/qrDrop';
import { peekDrop } from '@/lib/qrDropStore';
import QrShell from '../QrShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preuzmi fajl',
  robots: { index: false, follow: false },
};

export default async function QrDownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = isDropId(id) ? await peekDrop(id) : null;

  return (
    <QrShell>
      {meta ? (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">Preuzmi fajl</h1>
            <p className="mt-2 text-sm text-gray-600">
              Fajl se briše čim preuzimanje počne. Link radi samo jednom.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium">{meta.filename}</p>
            <p className="mt-1 text-xs text-gray-500">{formatBytes(meta.size)}</p>
            <form method="post" action={`/api/qr/${id}/file`} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white"
              >
                Preuzmi
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Fajl nije dostupan</h1>
          <p className="text-sm leading-6 text-gray-600">
            Ovaj fajl je već preuzet ili je link istekao, pa je obrisan.
          </p>
        </div>
      )}
    </QrShell>
  );
}
