import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import {
  dropExpired,
  isDropId,
  parseDropMeta,
  type DropMeta,
} from '@/lib/qrDrop';

const STORE_NAME = 'qr-drop';
const CLAIM_MS = 15_000;

export type StoredDrop = {
  bytes: Uint8Array;
  meta: DropMeta;
};

function onNetlify(): boolean {
  return process.env.NETLIFY === 'true' || process.env.QR_DROP_STORE === 'netlify';
}

function localDir(): string {
  return path.join(os.tmpdir(), 'matematickipodsjetnik-qr-drop');
}

function blobStore() {
  return getStore(STORE_NAME, { consistency: 'strong' });
}

export function createDropId(): string {
  return randomBytes(16).toString('hex');
}

export async function saveDrop(
  id: string,
  bytes: Uint8Array,
  meta: DropMeta,
): Promise<void> {
  if (!isDropId(id)) throw new Error('Neispravan identifikator.');
  if (onNetlify()) {
    const body = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const result = await blobStore().set(id, body, {
      metadata: { ...meta },
      onlyIfNew: true,
    });
    if (!result.modified) throw new Error('Fajl nije sačuvan.');
    return;
  }

  const dir = localDir();
  await mkdir(dir, { recursive: true });
  const bin = path.join(dir, `${id}.bin`);
  const metaPath = path.join(dir, `${id}.json`);
  const partial = `${bin}.partial`;
  await writeFile(partial, bytes);
  await writeFile(metaPath, JSON.stringify(meta));
  await rename(partial, bin);
}

export async function peekDrop(id: string): Promise<DropMeta | null> {
  if (!isDropId(id)) return null;
  if (onNetlify()) return peekNetlify(id);
  return peekLocal(id);
}

export async function takeDrop(id: string): Promise<StoredDrop | null> {
  if (!isDropId(id)) return null;
  if (onNetlify()) return takeNetlify(id);
  return takeLocal(id);
}

async function peekNetlify(id: string): Promise<DropMeta | null> {
  const store = blobStore();
  const entry = await store.getMetadata(id, { consistency: 'strong' });
  if (!entry) return null;
  const meta = parseDropMeta(entry.metadata);
  if (!meta || dropExpired(meta)) {
    await store.delete(id);
    await store.delete(claimKey(id));
    return null;
  }
  return meta;
}

async function takeNetlify(id: string): Promise<StoredDrop | null> {
  const store = blobStore();
  const entry = await store.getWithMetadata(id, {
    type: 'arrayBuffer',
    consistency: 'strong',
  });
  if (!entry?.data) return null;
  const meta = parseDropMeta(entry.metadata);
  if (!meta || dropExpired(meta)) {
    await store.delete(id);
    await store.delete(claimKey(id));
    return null;
  }

  const claimId = claimKey(id);
  const existingClaim = await store.get(claimId, {
    type: 'text',
    consistency: 'strong',
  });
  if (existingClaim) {
    const claimedAt = Number(existingClaim);
    if (Number.isFinite(claimedAt) && Date.now() - claimedAt < CLAIM_MS) {
      return null;
    }
    await store.delete(claimId);
  }

  const claim = await store.set(claimId, String(Date.now()), { onlyIfNew: true });
  if (!claim.modified) return null;

  await store.delete(id);
  await store.delete(claimId);
  return { bytes: new Uint8Array(entry.data), meta };
}

async function peekLocal(id: string): Promise<DropMeta | null> {
  const meta = await readLocalMeta(id);
  if (!meta) return null;
  if (dropExpired(meta)) {
    await deleteLocal(id);
    return null;
  }
  try {
    await stat(binPath(id));
  } catch {
    return null;
  }
  return meta;
}

async function takeLocal(id: string): Promise<StoredDrop | null> {
  const bin = binPath(id);
  const metaPath = jsonPath(id);
  const claimedBin = `${bin}.claimed`;
  const claimedMeta = `${metaPath}.claimed`;
  try {
    await rename(bin, claimedBin);
  } catch {
    return null;
  }
  try {
    await rename(metaPath, claimedMeta);
  } catch {
    await rm(claimedBin, { force: true });
    return null;
  }

  try {
    const meta = parseDropMeta(JSON.parse(await readFile(claimedMeta, 'utf8')));
    const bytes = new Uint8Array(await readFile(claimedBin));
    if (!meta || meta.size !== bytes.byteLength || dropExpired(meta)) return null;
    return { bytes, meta };
  } catch {
    return null;
  } finally {
    await rm(claimedBin, { force: true });
    await rm(claimedMeta, { force: true });
  }
}

async function readLocalMeta(id: string): Promise<DropMeta | null> {
  try {
    return parseDropMeta(JSON.parse(await readFile(jsonPath(id), 'utf8')));
  } catch {
    return null;
  }
}

async function deleteLocal(id: string): Promise<void> {
  await rm(binPath(id), { force: true });
  await rm(jsonPath(id), { force: true });
}

function binPath(id: string): string {
  return path.join(localDir(), `${id}.bin`);
}

function jsonPath(id: string): string {
  return path.join(localDir(), `${id}.json`);
}

function claimKey(id: string): string {
  return `claim-${id}`;
}
