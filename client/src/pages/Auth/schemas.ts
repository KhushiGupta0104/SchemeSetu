import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80, 'Name is too long.'),
    email: z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password is too long.')
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use at least one letter and one number.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
