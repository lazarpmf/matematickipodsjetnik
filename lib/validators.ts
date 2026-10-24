import { z } from 'zod';

export const lessonSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .refine(
      (val) => val.split(/\s+/).length <= 50,
      'Title must be 50 words or less'
    ),
  description: z.string().min(1, 'Description is required'),
  grade: z.number().int().min(6).max(9),
  pdf_path: z.string().min(1, 'PDF is required'),
  tags: z
    .array(z.string().min(1))
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
