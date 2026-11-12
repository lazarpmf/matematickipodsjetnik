import { findTaskByCode, isTaskId, publicTaskList, sortTasks, type TaskMeta } from './taskRules';
import { readTaskFile, readTasks } from './taskStore';

const WRONG_CODE = 'Pogrešan kod. Pokušaj ponovo.';

export function adminTaskList(tasks: TaskMeta[]) {
  return sortTasks(tasks).map((task) => ({
    id: task.id,
    title: task.title,
    code: task.code,
    isPublic: task.isPublic,
    filename: task.filename,
    size: task.size,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));
}

export async function taskListResponse(isAdmin: boolean): Promise<Response> {
  const tasks = await readTasks();
  if (!isAdmin) {
    return Response.json({ admin: false, tasks: publicTaskList(tasks) });
  }
  return Response.json({ admin: true, tasks: adminTaskList(tasks) });
}

export async function openTaskResponse(code: string): Promise<Response> {
  const tasks = await readTasks();
  const task = findTaskByCode(tasks, code);
  if (!task) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return Response.json({ message: WRONG_CODE }, { status: 401 });
  }
  return pdfResponse(task);
}

export async function publicFileResponse(id: string): Promise<Response> {
  if (!isTaskId(id)) {
    return Response.json({ message: 'Zadatak nije pronađen.' }, { status: 404 });
  }
  const task = (await readTasks()).find((item) => item.id === id);
  if (!task?.isPublic) {
    return Response.json({ message: 'Zadatak nije pronađen.' }, { status: 404 });
  }
  return pdfResponse(task);
}

async function pdfResponse(task: TaskMeta): Promise<Response> {
  const bytes = await readTaskFile(task.id);
  if (!bytes) {
    return Response.json({ message: 'PDF nije pronađen.' }, { status: 404 });
  }
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': inlineDisposition(task.filename),
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'x-task-id': task.id,
      'x-task-title': encodeURIComponent(task.title),
    },
  });
}

function inlineDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function readPdfUpload(file: FormDataEntryValue | null): Promise<{
  bytes: Uint8Array;
  filename: string;
} | null> {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, filename: file.name || 'zadatak.pdf' };
}

export function taskErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Zadatak nije sačuvan.';
  const status = /nije pronađen/i.test(message) ? 404 : 400;
  return Response.json({ message }, { status });
}
