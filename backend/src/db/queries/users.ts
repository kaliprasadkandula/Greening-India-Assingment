import { pool } from '../pool';
import { User } from '../../types';

export async function findUserByEmail(email: string): Promise<User | null> {
  const res = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email],
  );
  return res.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const res = await pool.query<User>(
    'SELECT * FROM users WHERE id = $1 LIMIT 1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await pool.query<User>(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.name, data.email, data.password],
  );
  return res.rows[0];
}
