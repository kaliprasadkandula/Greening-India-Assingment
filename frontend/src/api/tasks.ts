import { client } from './client';
import { Task } from '../types';

export const getTasks = (projectId: string, filters?: { status?: string; assignee?: string }) =>
  client.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`, { params: filters }).then((r) => r.data.tasks);

export const createTask = (projectId: string, data: Partial<Task>) =>
  client.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data);

export const updateTask = (id: string, data: Partial<Task>) =>
  client.patch<Task>(`/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: string) =>
  client.delete(`/tasks/${id}`);
