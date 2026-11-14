import type { Lesson } from './types';

const MAX_PINS = 100;

export function nextPinOrder(
  order: string[],
  id: string,
  pinned: boolean,
): string[] {
  const seen = new Set<string>([id]);
  const without: string[] = [];
  for (const item of order) {
    if (seen.has(item)) continue;
    seen.add(item);
    without.push(item);
  }
  if (!pinned) return without;
  return [id, ...without].slice(0, MAX_PINS);
}

export function applyPins(lessons: Lesson[], pinOrder: string[]): Lesson[] {
  const rank = new Map<string, number>();
  for (const id of pinOrder) {
    if (!rank.has(id)) rank.set(id, rank.size);
  }

  return lessons
    .map((lesson) => ({ ...lesson, pinned: rank.has(lesson.id) }))
    .sort((a, b) => {
      const ar = rank.get(a.id) ?? Number.POSITIVE_INFINITY;
      const br = rank.get(b.id) ?? Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
      return createdAt(b) - createdAt(a);
    });
}

function createdAt(lesson: Lesson): number {
  const value = Date.parse(lesson.created_at);
  return Number.isFinite(value) ? value : 0;
}
