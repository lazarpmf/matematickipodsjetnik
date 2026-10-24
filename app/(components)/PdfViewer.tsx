'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

interface PdfViewerProps {
  pdfUrl: string;
  zoomLevel: number;
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfViewer({ pdfUrl, zoomLevel }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateWidth());
      observer.observe(containerRef.current);
    } else {
      window.addEventListener('resize', updateWidth);
    }
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const pageWidth = Math.floor((containerWidth || 1) * (zoomLevel / 100));

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto bg-gray-100">
      <div className="flex justify-center px-2 py-4">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages: total }) => setNumPages(total)}
          loading={<p className="text-gray-600">Učitavanje PDF-a...</p>}
          error={<p className="text-red-600">Neuspjelo učitavanje PDF-a.</p>}
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => (
              <div key={`page_${index + 1}`} className="mb-4 last:mb-0">
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}
