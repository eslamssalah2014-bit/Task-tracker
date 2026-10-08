import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRepository } from '../repositories/userRepository';
import { sendError, sendSuccess } from '../utils/response';

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { email, password } = req.body;
    const user = await UserRepository.getByEmail(email);

    if (!user) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'disabled') {
      return sendError(res, 'Account is disabled. Please contact administrator.', 403, 'ACCOUNT_DISABLED');
    }

    await UserRepository.recordLogin(user.id);

    // In production with Supabase Auth: return session token. For now: provide valid mock token
    const token = user.id;

    return sendSuccess(res, {
      user,
      token,
      message: 'Login successful',
    });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<any> {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    return sendSuccess(res, req.user);
  }

  static async forgotPassword(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { email } = req.body;
    const user = await UserRepository.getByEmail(email);
    // Always return success to prevent email enumeration
    return sendSuccess(res, {
      message: 'If the email exists, a password reset link has been dispatched.',
    });
  }

  static async resetPassword(req: AuthenticatedRequest, res: Response): Promise<any> {
    return sendSuccess(res, { message: 'Password has been reset successfully.' });
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<any> {
    return sendSuccess(res, { message: 'Logged out successfully.' });
  }
}
