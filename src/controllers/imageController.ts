import { Request, Response } from "express";
import { KnownErrors } from "../errors";
import { prisma } from "../services/prisma";
import { imagesDir, processUploadedImage, variantUrl } from "../utils/imageStorage";
import path from "path";

/**
 * POST /api/images
 * Upload an image (used for avatars and group icons). Returns the stored
 * image record; the caller decides what to attach it to (own avatar, or a
 * group they admin) via the profile/group endpoints.
 */
export async function uploadImage(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new KnownErrors("ERR_IMAGE_NOT_UPLOADED");
  }

  const processed = await processUploadedImage(file.path, file.filename);

  const image = await prisma.image.create({
    data: {
      uploadedBy: req.username!,
      imageName: processed.imageName,
      basePath: processed.basePath,
      width: processed.width,
      height: processed.height,
    },
  });

  res.status(201).json({
    message: "Image uploaded successfully",
    image: {
      id: image.id,
      small: variantUrl(image.basePath, "small"),
      medium: variantUrl(image.basePath, "medium"),
      large: variantUrl(image.basePath, "large"),
    },
  });
}

/**
 * GET /api/images/:imageName/:variant
 * Serve a specific resized variant (small | medium | large) of an image.
 */
export async function getImage(req: Request, res: Response): Promise<void> {
  const { imageName, variant } = req.params;

  if (!["small", "medium", "large"].includes(variant)) {
    throw new KnownErrors("ERR_INVALID_REQUEST");
  }

  const image = await prisma.image.findUnique({ where: { imageName } });
  if (!image) {
    throw new KnownErrors("ERR_IMAGE_NOT_FOUND");
  }

  const filePath = path.join(imagesDir, `${imageName}_${variant}.webp`);
  res.sendFile(filePath, (err) => {
    if (err) {
      throw new KnownErrors("ERR_IMAGE_NOT_FOUND");
    }
  });
}
