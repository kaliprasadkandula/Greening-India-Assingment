import { pool } from '../pool';
import { Project, Task } from '../../types';

export async function listProjectsByUser(userId: string): Promise<Project[]> {
  const res = await pool.query<Project>(
    `SELECT DISTINCT p.*
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.owner_id = $1 OR t.assignee_id = $1
     ORDER BY p.created_at DESC`,
    [userId],
  );
  return res.rows;
}

export async function findProjectById(id: string): Promise<Project | null> {
  const res = await pool.query<Project>(
    'SELECT * FROM projects WHERE id = $1 LIMIT 1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function findProjectWithTasks(
  id: string,
): Promise<(Project & { tasks: Task[] }) | null> {
  const res = await pool.query<Project & { tasks: Task[] }>(
    `SELECT
       p.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id',          t.id,
             'title',       t.title,
             'description', t.description,
             'status',      t.status,
             'priority',    t.priority,
             'project_id',  t.project_id,
             'assignee_id', t.assignee_id,
             'due_date',    t.due_date,
             'created_at',  t.created_at,
             'updated_at',  t.updated_at
           ) ORDER BY t.created_at DESC
         ) FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) AS tasks
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function createProject(data: {
  name: string;
  description?: string | null;
  owner_id: string;
}): Promise<Project> {
  const res = await pool.query<Project>(
    `INSERT INTO projects (name, description, owner_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.name, data.description ?? null, data.owner_id],
  );
  return res.rows[0];
}

export async function updateProject(
  id: string,
  data: { name?: string; description?: string | null },
): Promise<Project | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    setClauses.push(`description = $${idx++}`);
    values.push(data.description);
  }

  if (setClauses.length === 0) return findProjectById(id);

  values.push(id);
  const res = await pool.query<Project>(
    `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return res.rows[0] ?? null;
}

export async function deleteProject(id: string): Promise<void> {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}
