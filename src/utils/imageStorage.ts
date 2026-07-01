import { mkdir } from "fs/promises";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { snowflakeIdGenerator } from "./snowflake";

export const imagesDir = path.resolve(__dirname, "../../uploads/images");

export const IMAGE_VARIANTS = [
  { name: "small", width: 64, height: 64 },
  { name: "medium", width: 256, height: 256 },
  { name: "large", width: 1024, height: 1024 },
] as const;

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await mkdir(imagesDir, { recursive: true });
    cb(null, imagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${snowflakeIdGenerator()}${ext}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

export interface ProcessedImage {
  imageName: string;
  basePath: string;
  width: number;
  height: number;
}

/**
 * Resize an uploaded image into small/medium/large variants synchronously,
 * inline in the request. No queue - chat avatars/icons are small and this
 * completes in milliseconds, so the added complexity of an async worker
 * isn't justified here.
 */
export async function processUploadedImage(
  uploadedFilePath: string,
  storedFileName: string
): Promise<ProcessedImage> {
  const metadata = await sharp(uploadedFilePath).metadata();
  const baseName = storedFileName.replace(path.extname(storedFileName), "");

  await Promise.all(
    IMAGE_VARIANTS.map((variant) =>
      sharp(uploadedFilePath)
        .resize(variant.width, variant.height, { fit: "cover" })
        .toFormat("webp")
        .toFile(path.join(imagesDir, `${baseName}_${variant.name}.webp`))
    )
  );

  return {
    imageName: baseName,
    basePath: `/uploads/images/${baseName}`,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

export function variantUrl(basePath: string, variant: "small" | "medium" | "large"): string {
  return `${basePath}_${variant}.webp`;
}
