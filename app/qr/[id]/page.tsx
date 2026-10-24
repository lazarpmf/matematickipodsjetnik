import type { Metadata } from 'next';
import { isDropId } from '@/lib/qrDrop';
import QrDropClient from '../QrDropClient';
import QrShell from '../QrShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pošalji na kompjuter',
  robots: { index: false, follow: false },
};

export default async function QrRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <QrShell>
      {isDropId(id) ? (
        <QrDropClient roomId={id} />
      ) : (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Link nije ispravan</h1>
          <p className="text-sm leading-6 text-gray-600">
            Otvori novi QR kod na kompjuteru.
          </p>
        </div>
      )}
    </QrShell>
  );
}
