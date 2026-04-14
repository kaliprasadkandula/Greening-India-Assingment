import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, getProjectStats } from '../api/projects';
import { updateTask, deleteTask } from '../api/tasks';
import { getUsers } from '../api/users';
import { Task, ProjectStats } from '../types';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import TaskModal from '../components/TaskModal';

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do', in_progress: 'In Progress', done: 'Done',
};
const STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};
const STATUS_BAR_COLORS: Record<Task['status'], string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-400',
  done: 'bg-green-400',
};
const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'bg-green-50 text-green-600',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-600',
};

type Tab = 'tasks' | 'stats';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { auth } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('tasks');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const isOwner = !!project && project.owner_id === auth?.user.id;

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => getProjectStats(id!),
    enabled: !!id && isOwner,
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: Task['status'] }) =>
      updateTask(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await qc.cancelQueries({ queryKey: ['project', id] });
      const prev = qc.getQueryData(['project', id]);
      qc.setQueryData(['project', id], (old: typeof project) => {
        if (!old) return old;
        return { ...old, tasks: old.tasks.map((t) => t.id === taskId ? { ...t, status } : t) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['project', id], ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['project-stats', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['project-stats', id] });
    },
  });

  if (isLoading) return <><Navbar /><Spinner /></>;
  if (isError || !project) return (
    <><Navbar />
      <div className="text-center py-16 text-red-500">Failed to load project.</div>
    </>
  );

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const filteredTasks = project.tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (assigneeFilter === 'unassigned' && t.assignee_id !== null) return false;
    if (assigneeFilter && assigneeFilter !== 'unassigned' && t.assignee_id !== assigneeFilter) return false;
    return true;
  });


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">← Projects</Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
          </div>
          <button onClick={() => { setEditTask(null); setShowTaskModal(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 whitespace-nowrap">
            + Add Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab('tasks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'tasks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            Tasks ({project.tasks.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setTab('stats')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'stats'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              Stats
            </button>
          )}
        </div>

        {/* Tasks tab */}
        {tab === 'tasks' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}{u.id === auth?.user.id ? ' (you)' : ''}</option>
                ))}
              </select>
              {(statusFilter || assigneeFilter) && (
                <button onClick={() => { setStatusFilter(''); setAssigneeFilter(''); }}
                  className="text-sm text-gray-400 hover:text-gray-600 px-2">
                  Clear filters ×
                </button>
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg">No tasks{statusFilter || assigneeFilter ? ' match the current filters' : ''}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 truncate">{task.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          {task.assignee_id && (
                            <span>👤 {task.assignee_id === auth?.user.id ? 'You' : (userMap[task.assignee_id] ?? 'Unknown')}</span>
                          )}
                          {task.due_date && <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select value={task.status}
                          onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value as Task['status'] })}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                        <button onClick={() => { setEditTask(task); setShowTaskModal(true); }}
                          className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                        {isOwner && (
                          <button onClick={() => deleteMutation.mutate(task.id)}
                            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100">Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats tab */}
        {tab === 'stats' && stats && (
          <StatsTab
            stats={stats}
            tasks={project.tasks}
            auth={auth}
            userMap={userMap}
          />
        )}

        {tab === 'stats' && !stats && (
          <div className="text-center py-16 text-gray-400">No stats available yet.</div>
        )}
      </main>

      {showTaskModal && (
        <TaskModal
          projectId={id!}
          task={editTask ?? undefined}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

// ── Stats tab ────────────────────────────────────────────────────────────────
function StatsTab({ stats, tasks, auth, userMap }: {
  stats: ProjectStats;
  tasks: Task[];
  auth: { user: { id: string } } | null;
  userMap: Record<string, string>;
}) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const statusCounts = useMemo(() => {
    const filtered = selectedAssignee === ''
      ? tasks
      : selectedAssignee === 'unassigned'
        ? tasks.filter((t) => t.assignee_id === null)
        : tasks.filter((t) => t.assignee_id === selectedAssignee);

    return (['todo', 'in_progress', 'done'] as const).map((s) => ({
      status: s,
      count: filtered.filter((t) => t.status === s).length,
      total: filtered.length,
    }));
  }, [tasks, selectedAssignee]);

  const assigneeOptions = [
    { value: '', label: 'All assignees' },
    { value: 'unassigned', label: 'Unassigned' },
    ...stats.by_assignee
      .filter((r) => r.assignee_id !== null)
      .map((r) => ({
        value: r.assignee_id!,
        label: r.assignee_id === auth?.user.id ? 'You' : (userMap[r.assignee_id!] ?? 'Unknown'),
      })),
  ];

  return (
    <div className="space-y-4">
      {/* Assignee selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500 shrink-0">View stats for</label>
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {assigneeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {statusCounts.map(({ status: s, count, total }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">{STATUS_LABELS[s]}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${STATUS_BAR_COLORS[s]}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall assignee breakdown (only when no specific assignee selected) */}
      {selectedAssignee === '' && stats.by_assignee.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-3">All assignees</p>
          <div className="space-y-2">
            {stats.by_assignee.map((r) => {
              const name = r.assignee_id
                ? (r.assignee_id === auth?.user.id ? 'You' : (userMap[r.assignee_id] ?? 'Unknown'))
                : 'Unassigned';
              return (
                <button
                  key={r.assignee_id ?? 'unassigned'}
                  onClick={() => setSelectedAssignee(r.assignee_id ?? 'unassigned')}
                  className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors text-left">
                  <span className="text-sm text-gray-600 flex-1 truncate">{name}</span>
                  <span className="text-sm font-medium text-gray-700 shrink-0">{r.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
