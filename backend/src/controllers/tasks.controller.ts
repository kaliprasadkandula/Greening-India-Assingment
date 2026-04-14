import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as tasksService from '../services/tasks.service';
import { TaskPriority, TaskStatus } from '../entities/Task';
import { validationError } from '../errors';

const createSchema = z.object({
  title: z.string().min(1, 'required'),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await tasksService.listTasks(req.params.id, {
      status: req.query.status as string | undefined,
      assignee: req.query.assignee as string | undefined,
    });
    res.json({ tasks });
  } catch (err) { next(err); }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return next(validationError(flattenErrors(parsed.error)));
    const task = await tasksService.createTask(req.params.id, req.user!.user_id, parsed.data);
    res.status(201).json(task);
  } catch (err) { next(err); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return next(validationError(flattenErrors(parsed.error)));
    const task = await tasksService.updateTask(req.params.id, req.user!.user_id, parsed.data);
    res.json(task);
  } catch (err) { next(err); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    await tasksService.deleteTask(req.params.id, req.user!.user_id);
    res.status(204).send();
  } catch (err) { next(err); }
}

function flattenErrors(error: z.ZodError) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? 'invalid']),
  );
}
