'use client';

import { useEffect } from 'react';

interface TaskPdfModalProps {
  title: string;
  pdfUrl: string;
  onClose: () => void;
}

export default function TaskPdfModal({ title, pdfUrl, onClose }: TaskPdfModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const download = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <h2 className="truncate text-base font-semibold text-gray-900">{title}</h2>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={download}
              className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Preuzmi
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-900 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700"
            >
              Zatvori
            </button>
          </div>
        </div>
        <iframe title={title} src={pdfUrl} className="h-full w-full flex-1 bg-gray-100" />
      </div>
    </div>
  );
}
