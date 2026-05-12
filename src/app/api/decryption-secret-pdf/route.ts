import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { DECRYPTION_KEY_TO_FILE, isDecryptionKey } from "@/lib/decryption-keys";

export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k")?.trim() ?? "";
  if (!isDecryptionKey(k)) {
    return new NextResponse("Укажите допустимый ключ в параметре k.", { status: 400 });
  }
  const filename = DECRYPTION_KEY_TO_FILE[k];
  const filePath = path.join(process.cwd(), filename);
  try {
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Файл не найден на сервере.", { status: 404 });
  }
}
