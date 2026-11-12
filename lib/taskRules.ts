export const MAX_TASK_BYTES = 4 * 1024 * 1024;
export const MAX_TASKS = 200;
export const MAX_TITLE_LENGTH = 120;
export const MAX_CODE_LENGTH = 40;

const TASK_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_PATTERN = /^[\p{L}\p{N}]+(?:[ -][\p{L}\p{N}]+)*$/u;

export type TaskMeta = {
  id: string;
  title: string;
  code: string;
  codeKey: string;
  isPublic: boolean;
  filename: string;
  size: number;
  createdAt: number;
  updatedAt: number;
};

export function isTaskId(id: string): boolean {
  return TASK_ID.test(id);
}

export function normalizeTaskCode(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sr');
}

export function validateTitle(input: string): string {
  const title = input.trim().replace(/\s+/g, ' ');
  if (!title) throw new Error('Naslov je obavezan.');
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error('Naslov može imati najviše 120 znakova.');
  }
  return title;
}

export function validateCode(input: string): { code: string; codeKey: string } {
  const code = input.trim().replace(/\s+/g, ' ');
  if (!code) throw new Error('Kod je obavezan.');
  if (code.length > MAX_CODE_LENGTH) {
    throw new Error('Kod može imati najviše 40 znakova.');
  }
  if (!CODE_PATTERN.test(code)) {
    throw new Error('Kod može imati slova, brojeve, razmak i crticu.');
  }
  return { code, codeKey: normalizeTaskCode(code) };
}

export function pdfFilename(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || 'zadatak.pdf';
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]/gu, '').slice(0, 80);
  if (!cleaned) return 'zadatak.pdf';
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

export function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export function codeTaken(
  tasks: TaskMeta[],
  codeKey: string,
  exceptId?: string,
): boolean {
  return tasks.some((task) => task.codeKey === codeKey && task.id !== exceptId);
}

export function findTaskByCode(tasks: TaskMeta[], input: string): TaskMeta | null {
  const codeKey = normalizeTaskCode(input);
  if (!codeKey) return null;
  return tasks.find((task) => task.codeKey === codeKey) ?? null;
}

export function publicTaskList(
  tasks: TaskMeta[],
): Array<{ id: string; title: string }> {
  return [...tasks]
    .filter((task) => task.isPublic)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((task) => ({ id: task.id, title: task.title }));
}

export function sortTasks(tasks: TaskMeta[]): TaskMeta[] {
  return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
}
