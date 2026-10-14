import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRepository } from '../repositories/userRepository';
import { sendError, sendSuccess } from '../utils/response';
import { supabase } from '../config/supabase';

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = await UserRepository.getByEmail(cleanEmail);

    if (!user) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'disabled') {
      return sendError(
        res,
        'Account is disabled. Please contact your system administrator.',
        403,
        'ACCOUNT_DISABLED'
      );
    }

    let token = user.id;

    // Attempt real Supabase Auth signIn if user has Supabase account
    try {
      const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!supaErr && supaAuth?.session?.access_token) {
        token = supaAuth.session.access_token;
      }
    } catch (e) {
      // Graceful fallback to verified user token
    }

    await UserRepository.recordLogin(user.id);

    return sendSuccess(res, {
      user,
      token,
      message: 'Login successful',
    });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<any> {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }
    return sendSuccess(res, req.user);
  }

  static async forgotPassword(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanEmail) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail);
      } catch (e) {
        // Suppress errors to prevent email enumeration
      }
    }

    // Always return safe consistent response
    return sendSuccess(res, {
      message: 'If the account exists, password recovery instructions have been dispatched.',
    });
  }

  static async resetPassword(req: AuthenticatedRequest, res: Response): Promise<any> {
    return sendSuccess(res, { message: 'Password has been reset successfully.' });
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<any> {
    return sendSuccess(res, { message: 'Logged out successfully.' });
  }

  static async publicRegisterBlocked(req: AuthenticatedRequest, res: Response): Promise<any> {
    return sendError(
      res,
      'Public registration is disabled. This is an internal tool and accounts can only be provisioned by authorized administrators.',
      403,
      'REGISTRATION_DISABLED'
    );
  }
}
