import { client } from './client';
import { User } from '../types';

interface AuthResponse { token: string; user: User; }

export const registerApi = (data: { name: string; email: string; password: string }) =>
  client.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const loginApi = (data: { email: string; password: string }) =>
  client.post<AuthResponse>('/auth/login', data).then((r) => r.data);
