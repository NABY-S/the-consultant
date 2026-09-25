// Crockford-style alphabet without I, L, O, U: easy to read aloud over the phone.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomChars(n: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  let out = '';
  for (const b of bytes) out += ALPHABET[b % 32];
  return out;
}

/** Time-sortable id (ULID layout: 10 chars of time + 16 random). */
export function newId(now = Date.now()): string {
  let time = '';
  let t = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[t % 32] + time;
    t = Math.floor(t / 32);
  }
  return time + randomChars(16);
}

/** Short reference shown to the visitor, e.g. TC-7K3Q9. */
export function newReference(): string {
  return `TC-${randomChars(5)}`;
}
