import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as projectsService from '../services/projects.service';
import { validationError } from '../errors';

const createSchema = z.object({
  name: z.string().min(1, 'required'),
  description: z.string().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await projectsService.listProjects(req.user!.user_id);
    res.json({ projects });
  } catch (err) { next(err); }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return next(validationError(flattenErrors(parsed.error)));
    const project = await projectsService.createProject(req.user!.user_id, parsed.data);
    res.status(201).json(project);
  } catch (err) { next(err); }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectsService.getProject(req.params.id);
    res.json(project);
  } catch (err) { next(err); }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return next(validationError(flattenErrors(parsed.error)));
    const project = await projectsService.updateProject(req.params.id, req.user!.user_id, parsed.data);
    res.json(project);
  } catch (err) { next(err); }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await projectsService.deleteProject(req.params.id, req.user!.user_id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getProjectStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await projectsService.getProjectStats(req.params.id, req.user!.user_id);
    res.json(stats);
  } catch (err) { next(err); }
}

function flattenErrors(error: z.ZodError) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? 'invalid']),
  );
}
