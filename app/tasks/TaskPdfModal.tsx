'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('../(components)/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-gray-600">
      Učitavanje PDF-a...
    </div>
  ),
});

interface TaskPdfModalProps {
  title: string;
  pdfUrl: string;
  onClose: () => void;
}

export default function TaskPdfModal({ title, pdfUrl, onClose }: TaskPdfModalProps) {
  const [zoomLevel, setZoomLevel] = useState(100);

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
        className="relative h-full w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-2 rounded-full bg-white/90 px-2 py-1 shadow-md backdrop-blur">
          <span className="max-w-xs truncate px-2 text-xs font-medium text-gray-800">
            {title}
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((value) => Math.max(50, value - 10))}
            className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            −
          </button>
          <span className="min-w-[36px] text-center text-xs text-gray-600">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((value) => Math.min(200, value + 10))}
            className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            +
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Preuzmi
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            ✕ Zatvori
          </button>
        </div>
        <PdfViewer pdfUrl={pdfUrl} zoomLevel={zoomLevel} />
      </div>
    </div>
  );
}
