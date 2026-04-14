import { client } from './client';
import { User } from '../types';

export const getUsers = () =>
  client.get<{ users: User[] }>('/users').then((r) => r.data.users);
