import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { KnownErrors } from "../errors";
import { prisma } from "../services/prisma";
import { getUserCache } from "../utils/userCache";
import { variantUrl } from "../utils/imageStorage";

function serializeUser(user: {
  username: string;
  displayName: string | null;
  email: string | null;
  avatarImage: { basePath: string } | null;
}) {
  return {
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarImage ? variantUrl(user.avatarImage.basePath, "medium") : null,
  };
}

/** GET /api/profile */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { username: req.username! },
    include: { avatarImage: true },
  });
  if (!user) throw new KnownErrors("ERR_USER_NOT_FOUND");

  res.json({ profile: serializeUser(user) });
}

/** PUT /api/profile - update displayName / email */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { displayName, email } = req.body;

  const user = await prisma.user.update({
    where: { username: req.username! },
    data: { displayName, email },
    include: { avatarImage: true },
  });

  res.json({ message: "Profile updated", profile: serializeUser(user) });
}

/** PUT /api/profile/avatar - body: { imageId } from a prior /api/images upload */
export async function setAvatar(req: Request, res: Response): Promise<void> {
  const { imageId } = req.body;
  if (!imageId) throw new KnownErrors("ERR_INVALID_REQUEST");

  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image || image.uploadedBy !== req.username) {
    throw new KnownErrors("ERR_IMAGE_NOT_FOUND");
  }

  const user = await prisma.user.update({
    where: { username: req.username! },
    data: { avatarImageId: imageId },
    include: { avatarImage: true },
  });

  res.json({ message: "Avatar updated", profile: serializeUser(user) });
}

/** PUT /api/groups/:groupId/icon - body: { imageId }. Only the group creator may set the icon. */
export async function setGroupIcon(req: Request, res: Response): Promise<void> {
  const { groupId } = req.params;
  const { imageId } = req.body;
  if (!imageId) throw new KnownErrors("ERR_INVALID_REQUEST");

  const group = await prisma.group.findUnique({ where: { groupId } });
  if (!group) throw new KnownErrors("ERR_INVALID_REQUEST");
  if (group.createdBy !== req.username) throw new KnownErrors("ERR_UNAUTHORIZED");

  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image || image.uploadedBy !== req.username) {
    throw new KnownErrors("ERR_IMAGE_NOT_FOUND");
  }

  const updated = await prisma.group.update({
    where: { groupId },
    data: { iconImageId: imageId },
    include: { iconImage: true },
  });

  res.json({
    message: "Group icon updated",
    iconUrl: updated.iconImage ? variantUrl(updated.iconImage.basePath, "medium") : null,
  });
}

/** PUT /api/profile/username */
export async function changeUsername(req: Request, res: Response): Promise<void> {
  const { newUsername, currentPassword } = req.body;
  const currentUsername = req.username!;

  const user = await prisma.user.findUnique({ where: { username: currentUsername } });
  if (!user) throw new KnownErrors("ERR_USER_NOT_FOUND");

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) throw new KnownErrors("ERR_AUTH_INVALID_PASSWORD");

  const taken = await prisma.user.findUnique({ where: { username: newUsername } });
  if (taken) throw new KnownErrors("ERR_AUTH_USERNAME_TAKEN");

  // username is the primary key and referenced by many tables via username
  // (not a surrogate id), so this must be a single update that Postgres
  // cascades through FK references - all relations in schema.prisma use
  // onUpdate: CASCADE (Prisma's default) for username references.
  await prisma.user.update({
    where: { username: currentUsername },
    data: { username: newUsername },
  });

  const userCache = await getUserCache();
  await userCache.invalidate(currentUsername);

  res.json({ message: "Username updated", username: newUsername });
}

/** PUT /api/profile/password */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { username: req.username! } });
  if (!user) throw new KnownErrors("ERR_USER_NOT_FOUND");

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) throw new KnownErrors("ERR_AUTH_INVALID_PASSWORD");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { username: req.username! },
    data: { password: hashedPassword },
  });

  const userCache = await getUserCache();
  await userCache.invalidate(req.username!);

  res.json({ message: "Password updated" });
}
