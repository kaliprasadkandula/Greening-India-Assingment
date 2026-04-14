import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getProjects } from '../api/projects';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ProjectModal from '../components/ProjectModal';

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + New Project
          </button>
        </div>

        {isLoading && <Spinner />}

        {isError && (
          <p className="text-center text-red-500 py-8">Failed to load projects.</p>
        )}

        {!isLoading && !isError && projects?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No projects yet.</p>
            <p className="text-sm mt-1">Create your first project to get started.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {projects?.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
              <h2 className="font-semibold text-gray-900">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </main>

      {showModal && <ProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
