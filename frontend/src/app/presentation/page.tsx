'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectCard from '../../components/Presentation/PptProjectCard';

// --- Type Definitions ---
interface IProject {
  id: string;
  projectId: string;
  title: string;
  updated_label: string;
  cover_image_url: string;
  status: 'active' | 'trashed' | 'deleted';
  created_at: string;
}

// --- Component ---
export default function HomePage() {
  const [projects, setProjects] = useState<IProject[] | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/active`);
        if (!res.ok) {
          setProjects([]);
          return;
        }
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [router]);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(decodeURIComponent(message));
      router.replace('/presentation', { scroll: false });
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Listen for search param changes (from navbar or direct URL)
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
  }, [searchParams]);

  // Listen for custom search events from the navbar (optional, for more dynamic updates)
  useEffect(() => {
    const handleSearchEvent = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setSearchTerm(e.detail);
      }
    };
    window.addEventListener('navbar-search', handleSearchEvent);
    return () => window.removeEventListener('navbar-search', handleSearchEvent);
  }, []);

  const filteredProjects = projects
    ? (searchTerm.trim()
        ? projects.filter(p => p.title && p.title.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        : projects)
    : null;

  const moveToTrash = (projectId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/${projectId}/trash`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setProjects(prev => prev ? prev.filter(p => p.projectId !== projectId) : null);
        setShowTrashModal(false);
        setPendingTrashId(null);
      })
      .catch(err => console.error('Error moving to trash:', err));
  };

  const openProject = (project: IProject) => {
    router.push(`/presentation/${project.projectId}?from=home`);
  };

  const handleDeleteClick = (projectId: string) => {
    setPendingTrashId(projectId);
    setShowTrashModal(true);
  };

  const handleModalClose = () => {
    setShowTrashModal(false);
    setPendingTrashId(null);
  };

  // The component now only returns the page-specific content.
  // The layout file wraps this with the Sidebar, Navbar, and <main> tag.
  return (
    <>
      {successMessage && (
        <div className="bg-green-500 text-white px-6 py-3 mb-4 rounded-lg shadow-lg flex items-center gap-2">
          <span>✅</span> {successMessage}
        </div>
      )}
      
      {/* Minimal Banner/Header for Projects */}
      {/* Remove the minimal banner/header for Projects from this file */}

      <div className='mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5'>
        {filteredProjects === null ? (
          <p className="text-gray-400">Loading projects...</p>
        ) : filteredProjects.length === 0 ? (
          <p className="text-gray-400 col-span-full">No projects found. Create a new one to get started!</p>
        ) : (
          filteredProjects.map(project => (
            <ProjectCard
              key={project.projectId}
              title={project.title}
              lastModified={project.updated_label}
              imageUrl={project.cover_image_url}
              status={project.status}
              onDelete={() => handleDeleteClick(project.projectId)}
              onOpen={() => openProject(project)}
            />
          ))
        )}
      </div>
      {showTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">Move to Trash?</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to move this project to the trash? You can restore it later from the bin.</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleModalClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Cancel</button>
              <button onClick={() => pendingTrashId && moveToTrash(pendingTrashId)} className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Move to Trash</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}