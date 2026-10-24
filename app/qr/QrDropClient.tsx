'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { MAX_DROP_BYTES, formatBytes, isDropId } from '@/lib/qrDrop';

type WaitingFile = {
  filename: string;
  size: number;
  mine: boolean;
};

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function senderFor(roomId: string): string {
  const key = `qr-drop-sender:${roomId}`;
  const existing = sessionStorage.getItem(key);
  if (existing && isDropId(existing)) return existing;
  const created = randomId();
  sessionStorage.setItem(key, created);
  return created;
}

export default function QrDropClient({ roomId }: { roomId?: string }) {
  const host = !roomId;
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [room, setRoom] = useState(roomId ?? '');
  const [sender, setSender] = useState('');
  const [file, setFile] = useState<WaitingFile | null>(null);
  const mineRef = useRef(false);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    if (roomId) {
      setRoom(roomId);
      setSender(senderFor(roomId));
      return;
    }
    const stored = sessionStorage.getItem('qr-drop-room');
    const next = stored && isDropId(stored) ? stored : randomId();
    sessionStorage.setItem('qr-drop-room', next);
    setRoom(next);
    setSender(senderFor(next));
  }, [roomId]);

  const roomUrl = origin && room ? `${origin}/qr/${room}` : '';

  useEffect(() => {
    if (!host || !roomUrl || !canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, roomUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#ffffff' },
    });
  }, [host, roomUrl]);

  useEffect(() => {
    if (!room || !sender) return;
    let stopped = false;
    async function poll() {
      const response = await fetch(`/api/qr/${room}?from=${sender}`, { cache: 'no-store' });
      if (!response.ok || stopped) return;
      const payload = (await response.json()) as { file: WaitingFile | null };
      if (uploadingRef.current && !payload.file) return;
      if (mineRef.current && !payload.file) {
        setNotice('Fajl je preuzet i obrisan.');
      }
      mineRef.current = Boolean(payload.file?.mine);
      setFile(payload.file);
    }
    void poll();
    const timer = window.setInterval(() => void poll(), 2000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [room, sender]);

  async function upload(chosen: File) {
    setError('');
    setNotice('');
    if (!room || !sender) return;
    if (chosen.size === 0) {
      setError('Izaberi fajl.');
      return;
    }
    if (chosen.size > MAX_DROP_BYTES) {
      setError('Fajl je veći od 5 MB.');
      return;
    }
    uploadingRef.current = true;
    setUploading(true);
    const body = new FormData();
    body.set('file', chosen);
    body.set('id', room);
    body.set('sender', sender);
    try {
      const response = await fetch('/api/qr', { method: 'POST', body });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || 'Fajl nije sačuvan. Probaj ponovo.');
        return;
      }
      mineRef.current = true;
      setFile({ filename: chosen.name, size: chosen.size, mine: true });
    } catch {
      setError('Fajl nije sačuvan. Probaj ponovo.');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function download() {
    setError('');
    const response = await fetch(`/api/qr/${room}/file`, { method: 'POST' });
    if (!response.ok) {
      setError('Fajl više nije dostupan.');
      setFile(null);
      return;
    }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') ?? '';
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
    const name = encoded ? decodeURIComponent(encoded) : file?.filename || 'fajl';
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    link.click();
    URL.revokeObjectURL(href);
    setFile(null);
    setNotice('Fajl je preuzet i obrisan.');
  }

  function newCode() {
    const next = randomId();
    sessionStorage.setItem('qr-drop-room', next);
    setRoom(next);
    setSender(senderFor(next));
    mineRef.current = false;
    setFile(null);
    setNotice('');
    setError('');
    setCopied(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
    } catch {
      setCopied(false);
      setError('Link nije kopiran. Označi ga ručno.');
    }
  }

  const incoming = file && !file.mine;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {host ? 'QR Drop' : 'Pošalji na kompjuter'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {host
            ? 'Skeniraj kod telefonom. Sa telefona možeš poslati fajl na ovaj kompjuter, a sa kompjutera na telefon. Fajl se briše čim se preuzme. Najviše 5 MB.'
            : 'Izaberi fajl i on stiže na kompjuter. Ako je kompjuter poslao fajl, ovdje ga preuzmi. Fajl se briše čim se preuzme.'}
        </p>
      </div>

      {host && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <div className="flex justify-center">
            <canvas ref={canvasRef} aria-label="QR kod za telefon" />
          </div>
          {roomUrl && (
            <p className="break-all text-center text-xs text-gray-500">{roomUrl}</p>
          )}
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
              onClick={newCode}
            >
              Novi kod
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && !file && (
        <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          {notice}
        </p>
      )}

      {incoming && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium">{file.filename}</p>
          <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
          <button
            type="button"
            className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white"
            onClick={() => void download()}
          >
            Preuzmi
          </button>
        </div>
      )}

      {file?.mine && (
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium">{file.filename}</p>
          <p className="mt-1 text-xs text-gray-500">{formatBytes(file.size)}</p>
          <p className="mt-3 text-sm text-gray-600">Čeka se drugi uređaj…</p>
        </div>
      )}

      {!file && (
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
            const chosen = event.dataTransfer.files[0];
            if (chosen) void upload(chosen);
          }}
        >
          <p className="text-sm text-gray-700">
            {host ? 'Ili izaberi fajl na ovom kompjuteru' : 'Prevuci fajl ovdje'}
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={uploading || !room}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Šaljem…' : host ? 'Pošalji na telefon' : 'Pošalji na kompjuter'}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) void upload(chosen);
            }}
          />
        </div>
      )}
    </div>
  );
}
