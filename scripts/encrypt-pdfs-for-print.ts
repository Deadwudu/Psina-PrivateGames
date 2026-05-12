/**
 * Собирает PDF для печати: текст из public/decryption/*.pdf извлекается,
 * шифруется циклическим числовым ключом (сдвиг Цезаря отдельно для латиницы и кириллицы),
 * результат — print/encrypted/*.encrypted-for-print.pdf (каталог в .gitignore, не для репозитория).
 *
 * Запуск: npm run encrypt:print-pdfs
 */
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "public", "decryption");
const OUT_DIR = path.join(ROOT, "print", "encrypted");
const DEJAVU = path.join(ROOT, "node_modules", "dejavu-fonts-ttf", "ttf", "DejaVuSans.ttf");

/** Как в игре: ключ → исходный файл */
const JOBS: { key: string; filename: string }[] = [
  { key: "3007", filename: "Object_300_Secret_File.pdf" },
  { key: "8081", filename: "Object_808_Hor.pdf" },
  { key: "2217", filename: "Object_221_Krot.pdf" },
  { key: "0428", filename: "Object_042_Pepel.pdf" },
  { key: "1114", filename: "Object_114_Pastyr.pdf" },
];

const RU_UPPER = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const RU_LOWER = RU_UPPER.toLowerCase();
const RU_LEN = RU_UPPER.length;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function parseKeyDigits(key: string): number[] {
  const d = [...key.trim()].map((c) => parseInt(c, 10)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 9);
  if (d.length === 0) throw new Error(`Некорректный ключ: ${key}`);
  return d;
}

function caesarShiftLetter(ch: string, shift: number): string {
  const s = mod(shift, 26);
  const code = ch.codePointAt(0)!;
  if (ch.length === 1 && code >= 0x41 && code <= 0x5a) {
    return String.fromCharCode(0x41 + mod(code - 0x41 + s, 26));
  }
  if (ch.length === 1 && code >= 0x61 && code <= 0x7a) {
    return String.fromCharCode(0x61 + mod(code - 0x61 + s, 26));
  }
  const iu = RU_UPPER.indexOf(ch);
  if (iu >= 0) return RU_UPPER[mod(iu + shift, RU_LEN)];
  const il = RU_LOWER.indexOf(ch);
  if (il >= 0) return RU_LOWER[mod(il + shift, RU_LEN)];
  return ch;
}

function encryptTextWithRepeatingDigitKey(text: string, key: string): string {
  const digits = parseKeyDigits(key);
  let letterIdx = 0;
  let out = "";
  for (const ch of text) {
    const isLatin = /^[A-Za-z]$/.test(ch);
    const isRu = RU_UPPER.includes(ch) || RU_LOWER.includes(ch);
    if (isLatin || isRu) {
      const sh = digits[letterIdx % digits.length]!;
      out += caesarShiftLetter(ch, sh);
      letterIdx += 1;
    } else {
      out += ch;
    }
  }
  return out;
}

function wrapToWidth(text: string, maxW: number, font: PDFFont, size: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const para of paragraphs) {
    if (para.length === 0) {
      lines.push("");
      continue;
    }
    const words = para.split(/(\s+)/);
    let line = "";
    const flush = () => {
      if (line.length) lines.push(line);
      line = "";
    };
    for (const w of words) {
      if (w === "") continue;
      const test = line + w;
      if (font.widthOfTextAtSize(test, size) <= maxW) {
        line = test;
        continue;
      }
      if (line.trim().length) flush();
      if (font.widthOfTextAtSize(w, size) <= maxW) {
        line = w;
        continue;
      }
      for (const ch of w) {
        const t2 = line + ch;
        if (font.widthOfTextAtSize(t2, size) <= maxW) line = t2;
        else {
          if (line.length) lines.push(line);
          line = ch;
        }
      }
    }
    flush();
  }
  return lines;
}

async function buildEncryptedPdf(plainText: string, outPath: string, title: string): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  let font: PDFFont;
  if (fs.existsSync(DEJAVU)) {
    font = await pdfDoc.embedFont(fs.readFileSync(DEJAVU));
  } else {
    console.warn("DejaVuSans.ttf не найден, используется Helvetica (кириллица может отобразиться некорректно).");
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 48;
  const fontSize = 9;
  const lineH = fontSize * 1.35;
  const maxW = pageW - 2 * margin;

  const header = `${title}\nКлюч: циклический числовой сдвиг по буквам (латиница / кириллица).\n\n`;
  const body = plainText;
  const allLines = wrapToWidth(header + body, maxW, font, fontSize);

  let page = pdfDoc.addPage([pageW, pageH]);
  let y = pageH - margin;

  for (const ln of allLines) {
    if (y < margin + lineH) {
      page = pdfDoc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    page.drawText(ln, {
      x: margin,
      y: y - fontSize,
      size: fontSize,
      font,
      color: rgb(0.05, 0.05, 0.08),
    });
    y -= lineH;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, await pdfDoc.save());
}

async function main(): Promise<void> {
  for (const { key, filename } of JOBS) {
    const src = path.join(SRC_DIR, filename);
    if (!fs.existsSync(src)) {
      console.error(`Пропуск (нет файла): ${src}`);
      continue;
    }
    const buf = fs.readFileSync(src);
    const parser = new PDFParse({ data: buf });
    const { text } = await parser.getText();
    await parser.destroy();
    const cipher = encryptTextWithRepeatingDigitKey(text, key);
    const base = filename.replace(/\.pdf$/i, "");
    const outName = `${base}.encrypted-for-print.pdf`;
    const outPath = path.join(OUT_DIR, outName);
    await buildEncryptedPdf(
      cipher,
      outPath,
      `ЗАШИФРОВАННАЯ КОПИЯ (печать) — ${base}`
    );
    console.log(`OK  ${key}  →  ${path.relative(ROOT, outPath)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
