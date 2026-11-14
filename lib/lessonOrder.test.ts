import assert from 'node:assert/strict';
import test from 'node:test';
import type { Lesson } from './types';
import { applyPins, nextPinOrder } from './lessonOrder';

function lesson(id: string, created_at: string): Lesson {
  return {
    id,
    title: id,
    description: 'opis',
    grade: 6,
    pdf_path: 'file.pdf',
    tags: ['#matematika'],
    created_at,
    updated_at: created_at,
  };
}

const older = '11111111-1111-4111-8111-111111111111';
const middle = '22222222-2222-4222-8222-222222222222';
const newer = '33333333-3333-4333-8333-333333333333';

test('newest lesson stays first when nothing is pinned', () => {
  const sorted = applyPins(
    [
      lesson(older, '2026-01-01T00:00:00.000Z'),
      lesson(newer, '2026-03-01T00:00:00.000Z'),
      lesson(middle, '2026-02-01T00:00:00.000Z'),
    ],
    [],
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
    lesson(middle, '2026-02-01T00:00:00.000Z'),
    lesson(older, '2026-01-01T00:00:00.000Z'),
  ];

  const pinnedOlder = nextPinOrder([], older, true);
  const pinnedBoth = nextPinOrder(pinnedOlder, middle, true);
  const sorted = applyPins(lessons, pinnedBoth);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [middle, older, newer],
  );
  assert.deepEqual(
    sorted.map((item) => item.pinned),
    [true, true, false],
  );

  const unpinned = applyPins(lessons, nextPinOrder(pinnedBoth, middle, false));
  assert.deepEqual(
    unpinned.map((item) => item.id),
    [older, newer, middle],
  );
});

test('pin order ignores duplicates and drops an unpinned id', () => {
  const once = nextPinOrder([older, older], middle, true);
  assert.deepEqual(once, [middle, older]);
  assert.deepEqual(nextPinOrder(once, older, false), [middle]);
});
