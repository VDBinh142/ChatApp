import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { snowflakeIdGenerator } from "./snowflake";

const uploadsDir = path.resolve(__dirname, "../../uploads");

export interface SavedFileDetails {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveFileFromBase64(
  base64Data: string,
  originalFileName: string,
  mimeType: string
): Promise<SavedFileDetails> {
  await mkdir(uploadsDir, { recursive: true });
  const fileBuffer = Buffer.from(base64Data, "base64");
  const safeName = sanitizeFileName(originalFileName);
  const storageName = `${snowflakeIdGenerator()}-${safeName}`;
  const targetPath = path.join(uploadsDir, storageName);
  await writeFile(targetPath, fileBuffer);

  return {
    fileUrl: `/uploads/${storageName}`,
    fileName: originalFileName,
    mimeType,
    fileSize: fileBuffer.length,
  };
}
