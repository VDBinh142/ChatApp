import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { KnownErrors } from "../errors";
import { prisma } from "../services/prisma";
import { getUserCache } from "../utils/userCache";

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password, email } = req.body;

  const userCache = await getUserCache();
  const existingUser = await userCache.get(username);
  if (existingUser) {
    throw new KnownErrors("ERR_AUTH_USERNAME_TAKEN");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await Promise.all([
    prisma.user.create({
      data: { username, password: hashedPassword, email },
    }),
    userCache.set(username),
  ]);

  res.status(201).json({ message: "User registered successfully", username });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  const userCache = await getUserCache();
  const user = await userCache.get(username);
  if (!user) {
    throw new KnownErrors("ERR_AUTH_USER_NOT_FOUND");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new KnownErrors("ERR_AUTH_INVALID_PASSWORD");
  }

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.status(200).json({ message: "Login successful", token, username: user.username });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: "Logout successful" });
}
