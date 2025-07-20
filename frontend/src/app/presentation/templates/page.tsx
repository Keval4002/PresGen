import React from 'react'

const templatesPage = () => {
  return (
    <div> templatesPage</div>
  )
}

export default templatesPage

/*
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectCard from '../../components/Presentation/PptProjectCard';

// --- Type Definitions ---
interface ITemplate {
  id: string;
  templateId: string;
  title: string;
  updated_label: string;
  cover_image_url: string;
  status: 'active' | 'trashed' | 'deleted';
  created_at: string;
}

// --- Component ---
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ITemplate[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/templates/active`)
      .then(res => res.json())
      .then((data: any[]) => {
        // Map backend fields to ITemplate
        const mapped = (Array.isArray(data) ? data : []).map(t => ({
          id: t._id,
          templateId: t._id,
          title: t.title,
          updated_label: t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '',
          cover_image_url: t.cover_image_url,
          status: t.status || 'active',
          created_at: t.created_at,
        }));
        setTemplates(mapped);
      })
      .catch(err => {
        console.error('Error fetching templates:', err);
        setTemplates([]);
      });
  }, []);

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

  const filteredTemplates: ITemplate[] = Array.isArray(templates)
    ? (searchTerm.trim()
        ? templates.filter(t => t && t.title && t.title.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        : templates)
    : [];

  const openTemplate = (template: ITemplate) => {
    router.push(`/presentation/templates/${template.id}`);
  };

  return (
    <>
      <div className='mt-2 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5'>
        {filteredTemplates.length === 0 ? (
          <p className="text-gray-400 col-span-full">No templates found. Add a new one to get started!</p>
        ) : (
          filteredTemplates.map(template => (
            template && template.id ? (
              <ProjectCard
                key={template.id}
                title={template.title}
                imageUrl={template.cover_image_url}
                status={template.status}
                isTemplate={true}
                // Do NOT pass onOpen for templates
              />
            ) : null
          ))
        )}
      </div>
    </>
  );
}
*/
