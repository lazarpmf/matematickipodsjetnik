import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import {
  codeTaken,
  isPdf,
  isTaskId,
  MAX_TASK_BYTES,
  MAX_TASKS,
  pdfFilename,
  sortTasks,
  validateCode,
  validateTitle,
  type TaskMeta,
} from './taskRules';

const STORE_NAME = 'lesson-tasks';
const META_KEY = 'meta';

let pending = Promise.resolve();

export type TaskInput = {
  title: string;
  code: string;
  isPublic: boolean;
  bytes: Uint8Array;
  filename: string;
};

export type TaskUpdate = {
  title: string;
  code: string;
  isPublic: boolean;
  bytes?: Uint8Array;
  filename?: string;
};

function onNetlify(): boolean {
  return process.env.NETLIFY === 'true';
}

function localDir(): string {
  return (
    process.env.TASKS_DIR ||
    path.join(os.tmpdir(), 'matematickipodsjetnik-tasks')
  );
}

function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = pending.then(task, task);
  pending = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function fileKey(id: string): string {
  return `file:${id}`;
}

export function parseTaskList(raw: string | null | undefined): TaskMeta[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];

  const tasks: TaskMeta[] = [];
  for (const item of value) {
    const task = parseTask(item);
    if (task) tasks.push(task);
  }
  return sortTasks(tasks).slice(0, MAX_TASKS);
}

function parseTask(value: unknown): TaskMeta | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<TaskMeta>;
  if (typeof item.id !== 'string' || !isTaskId(item.id)) return null;
  if (typeof item.title !== 'string' || typeof item.code !== 'string') return null;
  if (typeof item.codeKey !== 'string' || typeof item.filename !== 'string') return null;
  if (typeof item.isPublic !== 'boolean') return null;
  const size = item.size;
  const createdAt = item.createdAt;
  const updatedAt = item.updatedAt;
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_TASK_BYTES) {
    return null;
  }
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) return null;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return null;
  return {
    id: item.id,
    title: item.title,
    code: item.code,
    codeKey: item.codeKey,
    isPublic: item.isPublic,
    filename: item.filename,
    size,
    createdAt,
    updatedAt,
  };
}

export async function readTasks(): Promise<TaskMeta[]> {
  if (onNetlify()) {
    const raw = await getStore(STORE_NAME, { consistency: 'strong' }).get(META_KEY, {
      type: 'text',
      consistency: 'strong',
    });
    return parseTaskList(raw);
  }

  try {
    return parseTaskList(await readFile(metaPath(), 'utf8'));
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
}

export async function readTaskFile(id: string): Promise<Uint8Array | null> {
  if (!isTaskId(id)) return null;
  if (onNetlify()) {
    const data = await getStore(STORE_NAME, { consistency: 'strong' }).get(fileKey(id), {
      type: 'arrayBuffer',
      consistency: 'strong',
    });
    return data ? new Uint8Array(data) : null;
  }

  try {
    return new Uint8Array(await readFile(pdfPath(id)));
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

export async function createTask(input: TaskInput): Promise<TaskMeta> {
  const prepared = prepareFile(input.bytes, input.filename);
  const title = validateTitle(input.title);
  const { code, codeKey } = validateCode(input.code);

  return exclusive(async () => {
    const tasks = await readTasks();
    if (tasks.length >= MAX_TASKS) {
      throw new Error('Dostignut je najveći broj zadataka.');
    }
    if (codeTaken(tasks, codeKey)) throw new Error('Taj kod već postoji.');

    const now = Date.now();
    const task: TaskMeta = {
      id: crypto.randomUUID(),
      title,
      code,
      codeKey,
      isPublic: input.isPublic,
      filename: prepared.filename,
      size: prepared.bytes.byteLength,
      createdAt: now,
      updatedAt: now,
    };
    await writePdf(task.id, prepared.bytes);
    try {
      await writeMeta([task, ...tasks]);
    } catch (error) {
      await removePdf(task.id);
      throw error;
    }
    return task;
  });
}

export async function updateTask(id: string, input: TaskUpdate): Promise<TaskMeta> {
  if (!isTaskId(id)) throw new Error('Zadatak nije pronađen.');
  const title = validateTitle(input.title);
  const { code, codeKey } = validateCode(input.code);
  const replacement = input.bytes
    ? prepareFile(input.bytes, input.filename || 'zadatak.pdf')
    : null;

  return exclusive(async () => {
    const tasks = await readTasks();
    const current = tasks.find((task) => task.id === id);
    if (!current) throw new Error('Zadatak nije pronađen.');
    if (codeTaken(tasks, codeKey, id)) throw new Error('Taj kod već postoji.');

    const previous = replacement ? await readTaskFile(id) : null;
    if (replacement) await writePdf(id, replacement.bytes);

    const next: TaskMeta = {
      ...current,
      title,
      code,
      codeKey,
      isPublic: input.isPublic,
      filename: replacement?.filename ?? current.filename,
      size: replacement?.bytes.byteLength ?? current.size,
      updatedAt: Date.now(),
    };
    try {
      await writeMeta(tasks.map((task) => (task.id === id ? next : task)));
    } catch (error) {
      if (replacement) {
        if (previous) await writePdf(id, previous);
        else await removePdf(id);
      }
      throw error;
    }
    return next;
  });
}

export async function deleteTask(id: string): Promise<void> {
  if (!isTaskId(id)) throw new Error('Zadatak nije pronađen.');
  await exclusive(async () => {
    const tasks = await readTasks();
    if (!tasks.some((task) => task.id === id)) {
      throw new Error('Zadatak nije pronađen.');
    }
    await writeMeta(tasks.filter((task) => task.id !== id));
    await removePdf(id);
  });
}

function prepareFile(bytes: Uint8Array, filename: string): {
  bytes: Uint8Array;
  filename: string;
} {
  if (bytes.byteLength === 0) throw new Error('PDF je obavezan.');
  if (bytes.byteLength > MAX_TASK_BYTES) {
    throw new Error('PDF može imati najviše 4 MB.');
  }
  if (!isPdf(bytes)) throw new Error('Dozvoljen je samo PDF.');
  return { bytes, filename: pdfFilename(filename) };
}

async function writeMeta(tasks: TaskMeta[]): Promise<void> {
  const body = JSON.stringify(sortTasks(tasks));
  if (onNetlify()) {
    await getStore(STORE_NAME, { consistency: 'strong' }).set(META_KEY, body);
    return;
  }
  const file = metaPath();
  await mkdir(path.dirname(file), { recursive: true });
  const partial = `${file}.${process.pid}.partial`;
  await writeFile(partial, body);
  await rename(partial, file);
}

async function writePdf(id: string, bytes: Uint8Array): Promise<void> {
  if (onNetlify()) {
    const body = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    await getStore(STORE_NAME, { consistency: 'strong' }).set(fileKey(id), body);
    return;
  }
  const file = pdfPath(id);
  await mkdir(path.dirname(file), { recursive: true });
  const partial = `${file}.${process.pid}.partial`;
  await writeFile(partial, bytes);
  await rename(partial, file);
}

async function removePdf(id: string): Promise<void> {
  if (onNetlify()) {
    await getStore(STORE_NAME, { consistency: 'strong' }).delete(fileKey(id));
    return;
  }
  await rm(pdfPath(id), { force: true });
}

function metaPath(): string {
  return path.join(localDir(), 'meta.json');
}

function pdfPath(id: string): string {
  return path.join(localDir(), 'files', `${id}.pdf`);
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
