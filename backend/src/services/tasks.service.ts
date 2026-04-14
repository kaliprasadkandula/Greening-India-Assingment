import { AppDataSource } from '../config/dataSource';
import { Task, TaskPriority, TaskStatus } from '../entities/Task';
import { Project } from '../entities/Project';
import { forbidden, notFound } from '../errors';

const repo = () => AppDataSource.getRepository(Task);

export async function listTasks(
  projectId: string,
  filters: { status?: string; assignee?: string },
) {
  const qb = repo()
    .createQueryBuilder('t')
    .where('t.project_id = :projectId', { projectId })
    .orderBy('t.created_at', 'DESC');

  if (filters.status) qb.andWhere('t.status = :status', { status: filters.status });
  if (filters.assignee) qb.andWhere('t.assignee_id = :assignee', { assignee: filters.assignee });

  return qb.getMany();
}

export async function createTask(
  projectId: string,
  userId: string,
  data: {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  },
) {
  const project = await AppDataSource.getRepository(Project).findOneBy({ id: projectId });
  if (!project) throw notFound();

  const task = repo().create({
    title: data.title,
    description: data.description ?? null,
    status: data.status ?? TaskStatus.TODO,
    priority: data.priority ?? TaskPriority.MEDIUM,
    project_id: projectId,
    assignee_id: data.assignee_id ?? null,
    due_date: data.due_date ?? null,
    created_by: userId,
  });
  return repo().save(task);
}

export async function updateTask(
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  },
) {
  const task = await repo().findOne({ where: { id }, relations: { project: true } });
  if (!task) throw notFound();

  if (data.title !== undefined)       task.title       = data.title;
  if (data.description !== undefined) task.description = data.description ?? null;
  if (data.status !== undefined)      task.status      = data.status;
  if (data.priority !== undefined)    task.priority    = data.priority;
  if (data.assignee_id !== undefined) task.assignee_id = data.assignee_id ?? null;
  if (data.due_date !== undefined)    task.due_date    = data.due_date ?? null;
  return repo().save(task);
}

export async function deleteTask(id: string, userId: string) {
  const task = await repo().findOne({ where: { id }, relations: { project: true } });
  if (!task) throw notFound();
  const isProjectOwner = task.project.owner_id === userId;
  const isTaskCreator  = task.created_by === userId;
  if (!isProjectOwner && !isTaskCreator) throw forbidden();
  await repo().remove(task);
}
