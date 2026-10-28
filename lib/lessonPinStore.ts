import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import { nextPinOrder } from './lessonOrder';

const STORE_NAME = 'lesson-pins';
const KEY = 'order';
const MAX_PINS = 100;
const LESSON_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let pending = Promise.resolve();

function onNetlify(): boolean {
  return process.env.NETLIFY === 'true';
}

function localFile(): string {
  const dir =
    process.env.LESSON_PINS_DIR ||
    path.join(os.tmpdir(), 'matematickipodsjetnik-lesson-pins');
  return path.join(dir, 'order.json');
}

function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = pending.then(task, task);
  pending = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function parsePinOrder(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !LESSON_ID.test(item) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    ids.push(item);
    if (ids.length >= MAX_PINS) break;
  }
  return ids;
}

export async function readPinOrder(): Promise<string[]> {
  if (onNetlify()) {
    const raw = await getStore(STORE_NAME, { consistency: 'strong' }).get(KEY, {
      type: 'text',
      consistency: 'strong',
    });
    return parsePinOrder(raw);
  }

  try {
    return parsePinOrder(await readFile(localFile(), 'utf8'));
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }
}

export async function setPinnedLesson(
  id: string,
  pinned: boolean,
): Promise<string[]> {
  if (!LESSON_ID.test(id)) throw new Error('Neispravna kartica.');

  return exclusive(async () => {
    const next = nextPinOrder(await readPinOrder(), id, pinned);
    const body = JSON.stringify(next);
    if (onNetlify()) {
      await getStore(STORE_NAME, { consistency: 'strong' }).set(KEY, body);
      return next;
    }

    const file = localFile();
    await mkdir(path.dirname(file), { recursive: true });
    const partial = `${file}.${process.pid}.partial`;
    await writeFile(partial, body);
    await rename(partial, file);
    return next;
  });
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
