import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parsePinOrder, readPinOrder, setPinnedLesson } from './lessonPinStore';

const first = '11111111-1111-4111-8111-111111111111';
const second = '22222222-2222-4222-8222-222222222222';

test('pin store keeps the latest pin first and survives a reread', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'lesson-pins-'));
  const previousDir = process.env.LESSON_PINS_DIR;
  const previousNetlify = process.env.NETLIFY;
  process.env.LESSON_PINS_DIR = dir;
  delete process.env.NETLIFY;

  try {
    assert.deepEqual(await readPinOrder(), []);
    assert.deepEqual(await setPinnedLesson(first, true), [first]);
    assert.deepEqual(await setPinnedLesson(second, true), [second, first]);
    assert.deepEqual(await readPinOrder(), [second, first]);
    assert.deepEqual(await setPinnedLesson(second, false), [first]);
    assert.deepEqual(await readPinOrder(), [first]);
  } finally {
    if (previousDir === undefined) delete process.env.LESSON_PINS_DIR;
    else process.env.LESSON_PINS_DIR = previousDir;
    if (previousNetlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = previousNetlify;
    await rm(dir, { recursive: true, force: true });
  }
});

test('pin store rejects an id that is not a lesson id', async () => {
  await assert.rejects(() => setPinnedLesson('not-a-lesson', true), /Neispravna/);
});

test('parsePinOrder drops malformed entries', () => {
  assert.deepEqual(
    parsePinOrder(JSON.stringify([first, 'nope', first, second, 4])),
    [first, second],
  );
  assert.deepEqual(parsePinOrder('not-json'), []);
  assert.deepEqual(parsePinOrder('{"ids":[]}'), []);
});
