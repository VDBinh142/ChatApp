import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { KnownErrors } from '../../../shared/errors';
import { loginForm, registerForm } from '../../../shared/forms';
import { getUserCache } from '../utils/userCache';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    const userCache = await getUserCache();
    const existingUser = await userCache.get(username);

    if (existingUser) {
      throw new KnownErrors('ERR_INVALID_REQUEST', { detail: 'Username already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await Promise.all([
      prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      }),
      userCache.set(username),
    ]);

    res.status(201).json({
      message: 'User registered successfully',
      username,
    });
  } catch (error) {
    throw error;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    const userCache = await getUserCache();
    const user = await userCache.get(username);

    if (!user) {
      throw new KnownErrors('ERR_AUTH_EMAIL_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new KnownErrors('ERR_AUTH_INVALID_PASSWORD');
    }

    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
      }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      username: user.username,
    });
  } catch (error) {
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    throw error;
  }
}
