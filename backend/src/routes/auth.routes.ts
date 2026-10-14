import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from '../validators/user.validator';
import { requireAuthentication } from '../middleware/auth.middleware';

const router = Router();

// Publicly accessible auth endpoints
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Strictly block public registration on backend
router.post('/register', AuthController.publicRegisterBlocked);
router.post('/signup', AuthController.publicRegisterBlocked);

// Authenticated session endpoints
router.get('/me', requireAuthentication, AuthController.me);
router.post('/logout', requireAuthentication, AuthController.logout);

export default router;
