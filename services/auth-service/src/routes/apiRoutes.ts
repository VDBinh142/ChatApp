import express from 'express';
import { login, register } from '../controllers/authController';
import validate from '../../../shared/middlewares/validate';
import { loginForm, registerForm } from '../../../shared/forms';

export const createAuthRoutes = (): express.Router => {
  const router = express.Router();

  // Public routes
  router.post('/register', validate(registerForm), AuthController.register);
  router.post('/login', validate(loginForm), AuthController.login);

  // Protected routes
  router.post('/logout', verifyToken, AuthController.logout);

  return router;
};

export default createAuthRoutes();
