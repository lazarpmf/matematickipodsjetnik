import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findTaskByCode } from './taskRules';
import {
  createTask,
  deleteTask,
  readTaskFile,
  readTasks,
  updateTask,
} from './taskStore';

const pdf = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a,
]);

test('task store creates, opens by code, updates, and deletes', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tasks-'));
  const previousDir = process.env.TASKS_DIR;
  const previousNetlify = process.env.NETLIFY;
  process.env.TASKS_DIR = dir;
  delete process.env.NETLIFY;

  try {
    const created = await createTask({
      title: 'Sabiranje',
      code: 'Zima 7',
      isPublic: false,
      bytes: pdf,
      filename: 'sabiranje.pdf',
    });
    assert.equal(created.isPublic, false);
    assert.equal(findTaskByCode(await readTasks(), 'zima   7')?.id, created.id);
    assert.deepEqual(await readTaskFile(created.id), pdf);

    await assert.rejects(
      () =>
        createTask({
          title: 'Drugi',
          code: 'zima 7',
          isPublic: true,
          bytes: pdf,
          filename: 'drugi.pdf',
        }),
      /već postoji/,
    );

    const updated = await updateTask(created.id, {
      title: 'Sabiranje do 20',
      code: 'Proljece',
      isPublic: true,
    });
    assert.equal(updated.title, 'Sabiranje do 20');
    assert.equal(updated.isPublic, true);
    assert.equal((await readTasks())[0].code, 'Proljece');

    await deleteTask(created.id);
    assert.deepEqual(await readTasks(), []);
    assert.equal(await readTaskFile(created.id), null);
  } finally {
    if (previousDir === undefined) delete process.env.TASKS_DIR;
    else process.env.TASKS_DIR = previousDir;
    if (previousNetlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = previousNetlify;
    await rm(dir, { recursive: true, force: true });
  }
});

test('task store rejects a file that is not a pdf', async () => {
  await assert.rejects(
    () =>
      createTask({
        title: 'Tekst',
        code: 'tekst',
        isPublic: false,
        bytes: new Uint8Array([1, 2, 3, 4, 5]),
        filename: 'tekst.pdf',
      }),
    /samo PDF/,
  );
});
