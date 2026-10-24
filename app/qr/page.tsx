import type { Metadata } from 'next';
import QrDropClient from './QrDropClient';
import QrShell from './QrShell';

export const metadata: Metadata = {
  title: 'QR Drop',
  description:
    'Pošalji fajl na telefon. Fajl se briše odmah poslije preuzimanja.',
};

export default function QrDropPage() {
  return (
    <QrShell>
      <QrDropClient />
    </QrShell>
  );
}
