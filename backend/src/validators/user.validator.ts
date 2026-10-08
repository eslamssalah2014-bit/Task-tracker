import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role_name: z.enum(['Super Admin', 'Manager', 'Team Member']),
  department: z.string().optional(),
  job_title: z.string().optional(),
  timezone: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  status: z.enum(['active', 'disabled', 'pending']).optional(),
  avatar_url: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name is required'),
  description: z.string().optional(),
  manager_id: z.string().optional(),
  department: z.string().optional(),
  member_ids: z.array(z.string()).optional(),
});

export const updateTeamSchema = createTeamSchema.partial().extend({
  status: z.enum(['active', 'archived']).optional(),
});
