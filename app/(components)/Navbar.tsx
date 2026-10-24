'use client';

import Link from 'next/link';

interface NavbarProps {
  onAboutClick?: () => void;
  onHomeClick?: () => void;
  isAboutActive?: boolean;
}

export default function Navbar({
  onAboutClick,
  onHomeClick,
  isAboutActive = false,
}: NavbarProps) {
  const isHomeActive = !isAboutActive;
  const tabBase = 'px-4 py-1.5 text-sm font-medium transition-colors';
  const tabActive = 'text-gray-900';
  const tabInactive = 'text-gray-700 hover:text-gray-900';

  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between py-2">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link
              href="/"
              onClick={onHomeClick}
              className="text-gray-900 hover:text-gray-700"
            >
              <span
                className={`${tabBase} ${
                  isHomeActive ? tabActive : tabInactive
                }`}
              >
                <span className="flex flex-col leading-[1.1]">
                  <span className="text-[1.15rem] font-semibold">
                    Matematički podsjetnik
                  </span>
                  <span className="mt-0.5 text-[12px] text-gray-700">
                    za učenike osnovne škole
                  </span>
                </span>
              </span>
            </Link>
            <div className="hidden space-x-4 md:flex">
              <Link
                href="#about"
                onClick={onAboutClick}
                className={`${tabBase} ${
                  isAboutActive ? tabActive : tabInactive
                }`}
              >
                O nama
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/qr" className={`${tabBase} ${tabInactive}`}>
              QR Drop
            </Link>
            <div className="md:hidden">
              <button
                type="button"
                onClick={onAboutClick}
                className={`${tabBase} ${
                  isAboutActive ? tabActive : tabInactive
                }`}
              >
                O nama
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
