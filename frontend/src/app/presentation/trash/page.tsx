'use client';

import React, { useState, useEffect } from 'react';
import ProjectCard from '../../../components/Presentation/PptProjectCard';
import { useSearchParams } from 'next/navigation';

interface IProject {
  _id: string;
  id: string;
  title: string;
  updated_label: string;
  cover_image_url: string;
  status: 'active' | 'trashed' | 'deleted';
}

export default function TrashPage() {
  const [sampleProjects, setSampleProjects] = useState<IProject[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();

  // Fetch trashed projects from backend
  const fetchDeletedProjects = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/deleted`);
      if (!res.ok) throw new Error('Failed to fetch trashed projects');
      const data = await res.json();
      setSampleProjects(data);
    } catch (err) {
      setSampleProjects([]);
    }
  };

  useEffect(() => { fetchDeletedProjects(); }, []);

  useEffect(() => {
    // Listen for search param changes (from navbar or direct URL)
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
  }, [searchParams]);

  useEffect(() => {
    const handleSearchEvent = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setSearchTerm(e.detail);
      }
    };
    window.addEventListener('navbar-search', handleSearchEvent);
    return () => window.removeEventListener('navbar-search', handleSearchEvent);
  }, []);

  const filteredProjects = sampleProjects
    ? (searchTerm.trim()
        ? sampleProjects.filter(p => p.title && p.title.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        : sampleProjects)
    : null;

  // Restore project
  const handleRestore = async (projectId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${projectId}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore project');
      fetchDeletedProjects();
    } catch (err) {
      // Optionally show error
    }
  };

  // Permanently delete project
  const handlePermanentDelete = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      fetchDeletedProjects();
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <>
      {/* Remove the Trash heading from the main section */}
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {filteredProjects && filteredProjects.map(project => (
          <ProjectCard
            key={project.projectId}
            title={project.title}
            lastModified={project.updated_label}
            imageUrl={project.cover_image_url}
            status={project.status}
            onDelete={() => {}}
            onOpen={() => {}}
            onRestore={() => handleRestore(project.projectId)}
            onPermanentDelete={() => handlePermanentDelete(project.id)}
          />
        ))}
      </div>
    </>
  );
}