import * as Crypto from 'expo-crypto';

import type { Entropy } from './trialFactory';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const deviceEntropy: Entropy = {
  randomInt(n: number) {
    // Rejection sampling avoids modulo bias.
    const limit = Math.floor(0x100000000 / n) * n;
    for (;;) {
      const b = Crypto.getRandomBytes(4);
      const v = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
      if (v < limit) return v % n;
    }
  },
  randomHex(bytes: number) {
    return toHex(Crypto.getRandomBytes(bytes));
  },
  sha256(input: string) {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
  },
};

export function newId(): string {
  return Crypto.randomUUID();
}
