import type { Lesson } from './types';

export const PIN_TAG_PREFIX = '__pin:';

export function pinTimestamp(tags: string[] | null | undefined): number | null {
  if (!tags) return null;
  for (const tag of tags) {
    if (!tag.startsWith(PIN_TAG_PREFIX)) continue;
    const value = Number(tag.slice(PIN_TAG_PREFIX.length));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

export function visibleTags(tags: string[] | null | undefined): string[] {
  return (tags ?? []).filter((tag) => !tag.startsWith(PIN_TAG_PREFIX));
}

export function withPinTag(
  tags: string[] | null | undefined,
  pinned: boolean,
  now = Date.now(),
): string[] {
  const visible = visibleTags(tags);
  if (!pinned) return visible;
  return [`${PIN_TAG_PREFIX}${now}`, ...visible];
}

export function decorateLesson(lesson: Lesson): Lesson {
  const pinnedAt = pinTimestamp(lesson.tags);
  return {
    ...lesson,
    tags: visibleTags(lesson.tags),
    pinned: pinnedAt !== null,
    pinnedAt,
  };
}

export function sortPresentedLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => {
    const ar = a.pinnedAt ?? 0;
    const br = b.pinnedAt ?? 0;
    if (ar !== br) return br - ar;
    return createdAt(b) - createdAt(a);
  });
}

function createdAt(lesson: Lesson): number {
  const value = Date.parse(lesson.created_at);
  return Number.isFinite(value) ? value : 0;
}
