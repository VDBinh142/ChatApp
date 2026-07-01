import express from 'express';
import * as AuthController from '../controllers/authController';
import { verifyToken } from '../middlewares/auth';
import validate from '../../shared/middlewares/validate';
import { loginForm, registerForm } from '../../shared/forms';

const router = express.Router();

// Public routes
router.post('/register', validate(registerForm), AuthController.register);
router.post('/login', validate(loginForm), AuthController.login);

// Protected routes
router.post('/logout', verifyToken, AuthController.logout);

export default router;
