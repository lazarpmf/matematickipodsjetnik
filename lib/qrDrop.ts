export const MAX_DROP_BYTES = 5 * 1024 * 1024;
export const DEFAULT_DROP_TTL_MS = 60 * 60 * 1000;

export type DropMeta = {
  filename: string;
  contentType: string;
  size: number;
  createdAt: number;
  sender: string;
};

export function dropTtlMs(): number {
  const raw = process.env.QR_DROP_TTL_MS;
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  return DEFAULT_DROP_TTL_MS;
}

export function isDropId(id: string): boolean {
  return /^[a-f0-9]{32}$/.test(id);
}

export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.slice(0, 180) || 'fajl';
}

export function safeContentType(type: string): string {
  const value = type.trim().toLowerCase();
  if (
    !value ||
    value === 'text/html' ||
    value === 'application/xhtml+xml' ||
    value.includes('script')
  ) {
    return 'application/octet-stream';
  }
  if (!/^[\w.+-]+\/[\w.+-]+$/.test(value)) {
    return 'application/octet-stream';
  }
  return value;
}

export function parseDropMeta(raw: unknown): DropMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const filename =
    typeof value.filename === 'string' ? sanitizeFilename(value.filename) : '';
  const contentType =
    typeof value.contentType === 'string'
      ? safeContentType(value.contentType)
      : 'application/octet-stream';
  const size =
    typeof value.size === 'number' ? value.size : Number(value.size);
  const createdAt =
    typeof value.createdAt === 'number'
      ? value.createdAt
      : Number(value.createdAt);
  if (!filename || !Number.isFinite(size) || size <= 0 || size > MAX_DROP_BYTES) {
    return null;
  }
  if (!Number.isFinite(createdAt) || createdAt <= 0) return null;
  const sender =
    typeof value.sender === 'string' && isDropId(value.sender) ? value.sender : '';
  return { filename, contentType, size, createdAt, sender };
}

export function dropExpired(meta: DropMeta, now = Date.now()): boolean {
  return now - meta.createdAt > dropTtlMs();
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function publicOrigin(request: Request): string {
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return 'http://localhost:3000';
  const forwarded = request.headers.get('x-forwarded-proto');
  const proto =
    forwarded ??
    (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}
