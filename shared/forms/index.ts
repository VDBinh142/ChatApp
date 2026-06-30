import z from 'zod';

export const loginForm = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerForm = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  email: z.string().email().optional(),
});

export const friendRequestForm = z.object({
  receiverId: z.string(),
  content: z.string().optional(),
});

export const imageUploadForm = z.object({
  // Validation done via multer middleware
});
