import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { validationError } from '../errors';

const registerSchema = z.object({
  name: z.string().min(1, 'required'),
  email: z.string().email('must be a valid email'),
  password: z.string().min(6, 'must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('must be a valid email'),
  password: z.string().min(1, 'required'),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const fields = Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? 'invalid']),
      );
      return next(validationError(fields));
    }
    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const fields = Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? 'invalid']),
      );
      return next(validationError(fields));
    }
    const result = await authService.login(parsed.data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
