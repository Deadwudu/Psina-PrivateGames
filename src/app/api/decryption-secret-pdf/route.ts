import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const FILENAME = "Object_300_Secret_File.pdf";

export async function GET() {
  const filePath = path.join(process.cwd(), FILENAME);
  try {
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${FILENAME}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Файл не найден на сервере.", { status: 404 });
  }
}
