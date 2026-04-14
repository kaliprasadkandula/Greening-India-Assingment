import 'reflect-metadata';
import { AppDataSource } from '../src/config/dataSource';

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.query('TRUNCATE tasks, projects, users CASCADE');
});

afterAll(async () => {
  await AppDataSource.destroy();
});
