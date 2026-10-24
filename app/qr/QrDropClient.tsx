'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { MAX_DROP_BYTES, formatBytes } from '@/lib/qrDrop';

type ReadyDrop = {
  id: string;
  url: string;
  filename: string;
  size: number;
};

type Phase = 'idle' | 'uploading' | 'ready' | 'gone';

export default function QrDropClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [drop, setDrop] = useState<ReadyDrop | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!drop || phase !== 'ready' || !canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, drop.url, {
      width: 260,
      margin: 1,
      color: { dark: '#171717', light: '#ffffff' },
    });
  }, [drop, phase]);

  useEffect(() => {
    if (!drop || phase !== 'ready') return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/qr/${drop.id}`, { cache: 'no-store' });
      if (response.status === 404) setPhase('gone');
    }, 2000);
    return () => window.clearInterval(timer);
  }, [drop, phase]);

  async function upload(file: File) {
    setError('');
    setCopied(false);
    if (file.size === 0) {
      setError('Izaberi fajl.');
      return;
    }
    if (file.size > MAX_DROP_BYTES) {
      setError('Fajl je veći od 5 MB.');
      return;
    }

    setPhase('uploading');
    const body = new FormData();
    body.set('file', file);
    try {
      const response = await fetch('/api/qr', { method: 'POST', body });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        id?: string;
        url?: string;
        filename?: string;
        size?: number;
      } | null;
      if (!response.ok || !payload?.id || !payload.url || !payload.filename) {
        setPhase('idle');
        setError(payload?.error || 'Fajl nije sačuvan. Probaj ponovo.');
        return;
      }
      setDrop({
        id: payload.id,
        url: payload.url,
        filename: payload.filename,
        size: payload.size ?? file.size,
      });
      setPhase('ready');
    } catch {
      setPhase('idle');
      setError('Fajl nije sačuvan. Probaj ponovo.');
    }
  }

  function onFiles(list: FileList | null) {
    const file = list?.[0];
    if (file) void upload(file);
  }

  async function copyLink() {
    if (!drop) return;
    try {
      await navigator.clipboard.writeText(drop.url);
      setCopied(true);
    } catch {
      setCopied(false);
      setError('Link nije kopiran. Označi ga ručno.');
    }
  }

  function reset() {
    setDrop(null);
    setPhase('idle');
    setError('');
    setCopied(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">QR Drop</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Pošalji fajl na telefon. Fajl se briše odmah poslije preuzimanja.
          Ako ga niko ne preuzme, briše se poslije 60 minuta. Najviše 5 MB.
        </p>
      </div>

      {phase !== 'ready' && phase !== 'gone' && (
        <div
          className={`rounded-xl border-2 border-dashed px-6 py-10 text-center ${
            dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            onFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-sm text-gray-700">Prevuci fajl ovdje</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={phase === 'uploading'}
            onClick={() => inputRef.current?.click()}
          >
            {phase === 'uploading' ? 'Šaljem…' : 'Izaberi fajl'}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event) => onFiles(event.target.files)}
          />
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {phase === 'ready' && drop && (
        <div className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div>
            <p className="text-sm font-medium">{drop.filename}</p>
            <p className="text-xs text-gray-500">{formatBytes(drop.size)}</p>
          </div>
          <div className="flex justify-center">
            <canvas ref={canvasRef} aria-label="QR kod za preuzimanje" />
          </div>
          <p className="break-all text-center text-xs text-gray-500">{drop.url}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              onClick={() => void copyLink()}
            >
              {copied ? 'Kopirano' : 'Kopiraj link'}
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              onClick={reset}
            >
              Novi fajl
            </button>
          </div>
          <p className="text-center text-sm text-gray-600">Čeka se preuzimanje…</p>
        </div>
      )}

      {phase === 'gone' && (
        <div className="space-y-4 rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-800">
            Fajl je preuzet i obrisan.
          </p>
          <button
            type="button"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            onClick={reset}
          >
            Pošalji drugi fajl
          </button>
        </div>
      )}
    </div>
  );
}
