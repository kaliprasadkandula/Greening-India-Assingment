import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/dataSource';
import { User } from '../entities/User';
import { env } from '../config/env';
import { AppError, validationError } from '../errors';

const userRepo = () => AppDataSource.getRepository(User);

export async function register(data: { name: string; email: string; password: string }) {
  const existing = await userRepo().findOne({ where: { email: data.email } });
  if (existing) throw validationError({ email: 'already in use' });

  const hashed = await bcrypt.hash(data.password, 12);
  const user = userRepo().create({ name: data.name, email: data.email, password: hashed });
  await userRepo().save(user);

  const token = signToken(user);
  return { token, user: safeUser(user) };
}

export async function login(data: { email: string; password: string }) {
  const user = await userRepo()
    .createQueryBuilder('u')
    .addSelect('u.password')
    .where('u.email = :email', { email: data.email })
    .getOne();

  if (!user) throw new AppError(401, 'invalid credentials');

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) throw new AppError(401, 'invalid credentials');

  const token = signToken(user);
  return { token, user: safeUser(user) };
}

function signToken(user: User): string {
  return jwt.sign({ user_id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '24h' });
}

function safeUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}
