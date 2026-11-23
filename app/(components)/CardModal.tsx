'use client';

import { useEffect, useState } from 'react';
import type { Lesson } from '@/lib/types';
import { getPublicURL } from '@/lib/storage';
import { isPdfBytes, NOT_A_PDF_MESSAGE } from '@/lib/pdfBytes';

interface CardModalProps {
  lesson: Lesson | null;
  onClose: () => void;
}

export default function CardModal({ lesson, onClose }: CardModalProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfState, setPdfState] = useState<'checking' | 'pdf' | 'invalid'>('checking');

  useEffect(() => {
    if (lesson) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lesson]);

  useEffect(() => {
    if (!lesson) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lesson, onClose]);

  useEffect(() => {
    if (!lesson) return;
    setZoomLevel(100);
    setPdfState('checking');
    const pdfUrl = getPublicURL(lesson.pdf_path);
    let cancelled = false;
    fetch(pdfUrl, { headers: { Range: 'bytes=0-4' } })
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        if (cancelled) return;
        setPdfState(isPdfBytes(new Uint8Array(buffer)) ? 'pdf' : 'invalid');
      })
      .catch(() => {
        if (!cancelled) setPdfState('pdf');
      });
    return () => {
      cancelled = true;
    };
  }, [lesson]);

  if (!lesson) return null;

  const pdfUrl = getPublicURL(lesson.pdf_path);
  const clampZoom = (value: number) => Math.min(200, Math.max(50, value));

  const handleZoomOut = () => setZoomLevel((value) => clampZoom(value - 10));
  const handleZoomIn = () => setZoomLevel((value) => clampZoom(value + 10));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${lesson.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    printWindow.addEventListener('load', () => {
      printWindow.focus();
      printWindow.print();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative h-full w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-md backdrop-blur">
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              title="Umanji"
            >
              −
            </button>
            <span className="min-w-[36px] text-center text-xs text-gray-600">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              title="Uvećaj"
            >
              +
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            title="Štampaj PDF"
          >
            Štampaj
          </button>
          <button
            onClick={handleDownload}
            className="rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            title="Preuzmi PDF"
          >
            Preuzmi
          </button>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            title="Zatvori"
          >
            ✕ Zatvori
          </button>
        </div>
        {pdfState === 'checking' && (
          <div className="flex h-full items-center justify-center text-gray-600">
            Učitavanje PDF-a...
          </div>
        )}
        {pdfState === 'invalid' && (
          <div className="flex h-full items-center justify-center px-8 text-center text-gray-800">
            <p className="max-w-md text-base leading-relaxed">{NOT_A_PDF_MESSAGE}</p>
          </div>
        )}
        {pdfState === 'pdf' && (
          <iframe title={lesson.title} src={pdfUrl} className="h-full w-full bg-gray-100" />
        )}
      </div>
    </div>
  );
}
