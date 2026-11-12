import assert from 'node:assert/strict';
import test from 'node:test';
import {
  codeTaken,
  findTaskByCode,
  isPdf,
  normalizeTaskCode,
  pdfFilename,
  publicTaskList,
  validateCode,
  validateTitle,
  type TaskMeta,
} from './taskRules';

function task(partial: Partial<TaskMeta> & Pick<TaskMeta, 'id' | 'codeKey'>): TaskMeta {
  return {
    title: partial.title ?? partial.id,
    code: partial.code ?? partial.codeKey,
    isPublic: partial.isPublic ?? false,
    filename: 'zadatak.pdf',
    size: 10,
    createdAt: partial.createdAt ?? 1,
    updatedAt: partial.updatedAt ?? 1,
    ...partial,
  };
}

test('codes match without regard to case or extra spaces', () => {
  assert.equal(normalizeTaskCode('  Zima  7 '), 'zima 7');
  assert.equal(validateCode('Zima-7').codeKey, 'zima-7');
  assert.throws(() => validateCode('kod!'), /slova/);
  assert.throws(() => validateTitle('   '), /obavezan/);
});

test('public list hides private tasks and codes', () => {
  const tasks = [
    task({ id: '11111111-1111-4111-8111-111111111111', codeKey: 'a', isPublic: false, createdAt: 3 }),
    task({
      id: '22222222-2222-4222-8222-222222222222',
      codeKey: 'b',
      title: 'Javni',
      isPublic: true,
      createdAt: 1,
    }),
    task({
      id: '33333333-3333-4333-8333-333333333333',
      codeKey: 'c',
      title: 'Noviji',
      isPublic: true,
      createdAt: 2,
    }),
  ];

  assert.deepEqual(publicTaskList(tasks), [
    { id: tasks[2].id, title: 'Noviji' },
    { id: tasks[1].id, title: 'Javni' },
  ]);
  assert.equal(findTaskByCode(tasks, ' A ')?.id, tasks[0].id);
  assert.equal(codeTaken(tasks, 'b'), true);
  assert.equal(codeTaken(tasks, 'b', tasks[1].id), false);
});

test('pdf checks accept a real header and a safe filename', () => {
  assert.equal(isPdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), true);
  assert.equal(isPdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00])), false);
  assert.equal(pdfFilename('../Zadatak 1.pdf'), 'Zadatak 1.pdf');
  assert.equal(pdfFilename('biljeske'), 'biljeske.pdf');
});
