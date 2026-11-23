import assert from 'node:assert/strict';
import test from 'node:test';
import { isPdfBytes } from './pdfBytes';

test('accepts a PDF header and rejects a phone photo', () => {
  assert.equal(
    isPdfBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])),
    true,
  );
  const heic = new Uint8Array([
    0x00, 0x00, 0x00, 0x28, 0x66, 0x74, 0x79, 0x70,
  ]);
  assert.equal(isPdfBytes(heic), false);
  assert.equal(isPdfBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46])), false);
});
