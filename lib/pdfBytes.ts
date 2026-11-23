export function isPdfBytes(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export const NOT_A_PDF_MESSAGE =
  'Ovo nije PDF. Slika sa telefona ne može da se otvori ovdje. Sačuvaj dokument kao PDF, pa ga dodaj.';
