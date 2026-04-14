import { pool } from '../pool';
import { Task, TaskPriority, TaskStatus } from '../../types';

export async function listTasksByProject(
  projectId: string,
  filters: { status?: string; assignee?: string },
): Promise<Task[]> {
  const conditions = ['project_id = $1'];
  const values: unknown[] = [projectId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.assignee) {
    conditions.push(`assignee_id = $${idx++}`);
    values.push(filters.assignee);
  }

  const res = await pool.query<Task>(
    `SELECT * FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    values,
  );
  return res.rows;
}

export async function findTaskById(id: string): Promise<Task | null> {
  const res = await pool.query<Task>(
    'SELECT * FROM tasks WHERE id = $1 LIMIT 1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function createTask(data: {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  project_id: string;
  assignee_id?: string | null;
  due_date?: string | null;
}): Promise<Task> {
  const res = await pool.query<Task>(
    `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.title,
      data.description ?? null,
      data.status ?? 'todo',
      data.priority ?? 'medium',
      data.project_id,
      data.assignee_id ?? null,
      data.due_date ?? null,
    ],
  );
  return res.rows[0];
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  },
): Promise<Task | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fields = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date'] as const;
  for (const field of fields) {
    if (data[field] !== undefined) {
      setClauses.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }

  if (setClauses.length === 0) return findTaskById(id);

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const res = await pool.query<Task>(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return res.rows[0] ?? null;
}

export async function deleteTask(id: string): Promise<void> {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
}

export interface TaskStats {
  by_status: { status: TaskStatus; count: number }[];
  by_assignee: { assignee_id: string | null; count: number }[];
}

export async function getProjectStats(projectId: string): Promise<TaskStats> {
  const [statusRes, assigneeRes] = await Promise.all([
    pool.query<{ status: TaskStatus; count: string }>(
      `SELECT status, COUNT(*) as count FROM tasks WHERE project_id = $1 GROUP BY status`,
      [projectId],
    ),
    pool.query<{ assignee_id: string | null; count: string }>(
      `SELECT assignee_id, COUNT(*) as count FROM tasks WHERE project_id = $1 GROUP BY assignee_id`,
      [projectId],
    ),
  ]);

  return {
    by_status: statusRes.rows.map((r) => ({ status: r.status, count: Number(r.count) })),
    by_assignee: assigneeRes.rows.map((r) => ({ assignee_id: r.assignee_id, count: Number(r.count) })),
  };
}
