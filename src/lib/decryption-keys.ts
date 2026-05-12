/** Ключ → имя PDF в `public/decryption/` (отдаётся Next как статика — работает и локально, и на Vercel). */
export const DECRYPTION_KEY_TO_FILE = {
  "3007": "Object_300_Secret_File.pdf",
  "8081": "Object_808_Hor.pdf",
  "2217": "Object_221_Krot.pdf",
  "0428": "Object_042_Pepel.pdf",
  "1114": "Object_114_Pastyr.pdf",
} as const;

const STATIC_BASE = "/decryption";

export type DecryptionKey = keyof typeof DECRYPTION_KEY_TO_FILE;

export function isDecryptionKey(s: string): s is DecryptionKey {
  return s in DECRYPTION_KEY_TO_FILE;
}

export function pdfUrlForKey(k: DecryptionKey): string {
  return `${STATIC_BASE}/${encodeURIComponent(DECRYPTION_KEY_TO_FILE[k])}`;
}
