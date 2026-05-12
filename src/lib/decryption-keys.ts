/** Ключ → PDF в корне проекта (process.cwd()). Только эти пары допустимы в API. */
export const DECRYPTION_KEY_TO_FILE = {
  "3007": "Object_300_Secret_File.pdf",
  "8081": "Object_808_Hor.pdf",
  "2217": "Object_221_Krot.pdf",
  "0428": "Object_042_Pepel.pdf",
  "1114": "Object_114_Pastyr.pdf",
} as const;

export type DecryptionKey = keyof typeof DECRYPTION_KEY_TO_FILE;

export function isDecryptionKey(s: string): s is DecryptionKey {
  return s in DECRYPTION_KEY_TO_FILE;
}

export function pdfUrlForKey(k: DecryptionKey): string {
  return `/api/decryption-secret-pdf?k=${encodeURIComponent(k)}`;
}
