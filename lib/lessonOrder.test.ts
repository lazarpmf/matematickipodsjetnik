import assert from 'node:assert/strict';
import test from 'node:test';
import type { Lesson } from './types';
import {
  decorateLesson,
  pinTimestamp,
  sortPresentedLessons,
  visibleTags,
  withPinTag,
} from './lessonOrder';

function lesson(id: string, created_at: string, tags: string[] = ['#matematika']): Lesson {
  return {
    id,
    title: id,
    description: 'opis',
    grade: 6,
    pdf_path: 'file.pdf',
    tags,
    created_at,
    updated_at: created_at,
  };
}

const older = '11111111-1111-4111-8111-111111111111';
const middle = '22222222-2222-4222-8222-222222222222';
const newer = '33333333-3333-4333-8333-333333333333';

test('newest lesson stays first when nothing is pinned', () => {
  const sorted = sortPresentedLessons(
    [
      lesson(older, '2026-01-01T00:00:00.000Z'),
      lesson(newer, '2026-03-01T00:00:00.000Z'),
      lesson(middle, '2026-02-01T00:00:00.000Z'),
    ].map(decorateLesson),
  );

  assert.deepEqual(
    sorted.map((item) => item.id),
    [newer, middle, older],
  );
  assert.equal(sorted.every((item) => item.pinned === false), true);
});

test('pinned lessons stay ahead of newer ones, latest pin first', () => {
  const lessons = [
    lesson(newer, '2026-03-01T00:00:00.000Z'),
    lesson(middle, '2026-02-01T00:00:00.000Z', withPinTag(['#matematika'], true, 20)),
    lesson(older, '2026-01-01T00:00:00.000Z', withPinTag(['#matematika'], true, 10)),
  ].map(decorateLesson);
  const sorted = sortPresentedLessons(lessons);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [middle, older, newer],
  );
  assert.deepEqual(
    sorted.map((item) => item.pinned),
    [true, true, false],
  );
  assert.deepEqual(sorted[0].tags, ['#matematika']);
  assert.equal(pinTimestamp(withPinTag(['#matematika'], false)), null);
  assert.deepEqual(visibleTags(['__pin:5', '#zbir']), ['#zbir']);
});
