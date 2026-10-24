import Link from 'next/link';

export default function QrShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="leading-tight">
            <span className="block text-base font-semibold">
              Matematički podsjetnik
            </span>
            <span className="block text-xs text-gray-600">
              za učenike osnovne škole
            </span>
          </Link>
          <span className="text-sm font-medium text-gray-700">QR Drop</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-8">{children}</main>
    </div>
  );
}
