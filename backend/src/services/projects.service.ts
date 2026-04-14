import { AppDataSource } from '../config/dataSource';
import { Project } from '../entities/Project';
import { Task } from '../entities/Task';
import { forbidden, notFound } from '../errors';

const repo = () => AppDataSource.getRepository(Project);

export async function listProjects(userId: string) {
  return repo()
    .createQueryBuilder('p')
    .leftJoin('p.tasks', 't')
    .where('p.owner_id = :uid OR t.assignee_id = :uid', { uid: userId })
    .distinct(true)
    .orderBy('p.created_at', 'DESC')
    .getMany();
}

export async function createProject(
  userId: string,
  data: { name: string; description?: string | null },
) {
  const project = repo().create({ name: data.name, description: data.description ?? null, owner_id: userId });
  return repo().save(project);
}

export async function getProject(id: string) {
  const project = await repo().findOne({
    where: { id },
    relations: { tasks: true },
    order: { tasks: { created_at: 'DESC' } },
  });
  if (!project) throw notFound();
  return project;
}

export async function updateProject(
  id: string,
  userId: string,
  data: { name?: string; description?: string | null },
) {
  const project = await repo().findOneBy({ id });
  if (!project) throw notFound();
  if (project.owner_id !== userId) throw forbidden();

  Object.assign(project, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
  });
  return repo().save(project);
}

export async function deleteProject(id: string, userId: string) {
  const project = await repo().findOneBy({ id });
  if (!project) throw notFound();
  if (project.owner_id !== userId) throw forbidden();
  await repo().remove(project);
}

export async function getProjectStats(id: string, userId: string) {
  const project = await repo().findOneBy({ id });
  if (!project) throw notFound();
  if (project.owner_id !== userId) throw forbidden();

  const taskRepo = AppDataSource.getRepository(Task);

  const [byStatus, byAssignee] = await Promise.all([
    taskRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.project_id = :id', { id })
      .groupBy('t.status')
      .getRawMany(),
    taskRepo
      .createQueryBuilder('t')
      .select('t.assignee_id', 'assignee_id')
      .addSelect('COUNT(*)', 'count')
      .where('t.project_id = :id', { id })
      .groupBy('t.assignee_id')
      .getRawMany(),
  ]);

  return {
    by_status: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    by_assignee: byAssignee.map((r) => ({ assignee_id: r.assignee_id, count: Number(r.count) })),
  };
}
