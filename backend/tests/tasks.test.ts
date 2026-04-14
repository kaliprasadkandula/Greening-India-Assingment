import request from 'supertest';
import app from '../src/app';
import './setup';

const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

async function createUserAndLogin() {
  const email = uniqueEmail();
  await request(app).post('/auth/register').send({ name: 'Dev', email, password: 'password123' });
  const res = await request(app).post('/auth/login').send({ email, password: 'password123' });
  return res.body.token as string;
}

describe('Tasks API', () => {
  it('creates a task and retrieves it with status filter', async () => {
    const token = await createUserAndLogin();

    // Create project
    const proj = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' });
    expect(proj.status).toBe(201);

    // Create task
    const task = await request(app)
      .post(`/projects/${proj.body.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Task', priority: 'high', status: 'todo' });
    expect(task.status).toBe(201);
    expect(task.body.title).toBe('My Task');

    // Filter by status — should find the task
    const found = await request(app)
      .get(`/projects/${proj.body.id}/tasks?status=todo`)
      .set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200);
    expect(found.body.tasks.some((t: { id: string }) => t.id === task.body.id)).toBe(true);

    // Filter by different status — should not find it
    const notFound = await request(app)
      .get(`/projects/${proj.body.id}/tasks?status=done`)
      .set('Authorization', `Bearer ${token}`);
    expect(notFound.body.tasks.some((t: { id: string }) => t.id === task.body.id)).toBe(false);
  });

  it('returns 403 when non-owner tries to delete a task', async () => {
    const ownerToken = await createUserAndLogin();
    const otherToken = await createUserAndLogin();

    const proj = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Owner Project' });

    const task = await request(app)
      .post(`/projects/${proj.body.id}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Owner Task' });

    // Other user tries to delete
    const res = await request(app)
      .delete(`/tasks/${task.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 when accessing tasks without a token', async () => {
    const res = await request(app).get('/projects/some-id/tasks');
    expect(res.status).toBe(401);
  });
});
