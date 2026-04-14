import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../src/config/dataSource';
import { User } from '../src/entities/User';
import { Project } from '../src/entities/Project';
import { Task, TaskPriority, TaskStatus } from '../src/entities/Task';

async function seed() {
  await AppDataSource.initialize();

  const userRepo    = AppDataSource.getRepository(User);
  const projectRepo = AppDataSource.getRepository(Project);
  const taskRepo    = AppDataSource.getRepository(Task);

  // Idempotent — skip if seed user already exists
  const existing = await userRepo.findOneBy({ email: 'test@example.com' });
  if (existing) {
    console.log('Seed data already present, skipping.');
    await AppDataSource.destroy();
    return;
  }

  const hash = await bcrypt.hash('password123', 12);
  const user = await userRepo.save(
    userRepo.create({ name: 'Test User', email: 'test@example.com', password: hash }),
  );

  const project = await projectRepo.save(
    projectRepo.create({ name: 'Demo Project', description: 'A seed project for testing', owner_id: user.id }),
  );

  await taskRepo.save([
    taskRepo.create({ title: 'Set up CI pipeline',      status: TaskStatus.DONE,        priority: TaskPriority.HIGH,   project_id: project.id, assignee_id: user.id }),
    taskRepo.create({ title: 'Design database schema',  status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, project_id: project.id, assignee_id: user.id }),
    taskRepo.create({ title: 'Write API documentation', status: TaskStatus.TODO,         priority: TaskPriority.LOW,    project_id: project.id }),
  ]);

  console.log('Seed complete.');
  console.log('  Email:    test@example.com');
  console.log('  Password: password123');

  await AppDataSource.destroy();
}

seed().catch((err) => { console.error(err); process.exit(1); });
