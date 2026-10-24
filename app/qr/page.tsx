import type { Metadata } from 'next';
import QrDropClient from './QrDropClient';
import QrShell from './QrShell';

export const metadata: Metadata = {
  title: 'QR Drop',
  description:
    'Pošalji fajl sa kompjutera na telefon ili sa telefona na kompjuter. Fajl se briše čim se preuzme.',
};

export default function QrDropPage() {
  return (
    <QrShell>
      <QrDropClient />
    </QrShell>
  );
}
