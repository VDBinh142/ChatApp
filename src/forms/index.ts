import { z } from "zod";

export const registerForm = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8),
  email: z.string().email().optional(),
});

export const loginForm = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const sendFriendRequestForm = z.object({
  receiverId: z.string().min(1),
  content: z.string().max(280).optional(),
});

export const respondFriendRequestForm = z.object({
  accept: z.boolean(),
});

export const updateProfileForm = z.object({
  displayName: z.string().max(64).optional(),
  email: z.string().email().optional(),
});

export const changeUsernameForm = z.object({
  newUsername: z.string().min(3).max(32),
  currentPassword: z.string().min(1),
});

export const changePasswordForm = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
