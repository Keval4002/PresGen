'use client';

import React from 'react';
import NewProjectCard from '../../../components/Presentation/NewProjectCard';
import { Wand2, PenSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function NewProjectPage() {
  const router = useRouter();

  // ... (handler functions remain the same)
  const handleAiClick = () => {
    const params = new URLSearchParams({ mode: 'ai', initialSlideCount: '5' });
    router.push(`/presentation/themes?${params.toString()}`); // Note: Added /presentation prefix
  }

  const handleManualClick = async () => {
    // Generate a unique projectId
    const projectId = uuidv4();
    // Prepare blank project data
    const blankProject = {
      projectId,
      slides: [{ canvasElements: [] }],
      theme: { background_color: '#fff' },
      title: 'Untitled Presentation',
    };
    // Save to localStorage only
    localStorage.setItem(`draft_presentation_${projectId}`, JSON.stringify(blankProject));
    // Route to the editor for this project
    router.push(`/presentation/edit/${projectId}`);
  }

  // The component now only returns its unique content.
  // No more layout boilerplate!
  return (
    <>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className='text-4xl font-bold text-gray-900'>
          Create a New Project
        </h1>

        <p className='mt-3 text-lg text-gray-600'>
          Choose how you want to start your next presentation.
        </p>
      </div>

      <div className='mt-12 flex flex-col md:flex-row justify-center items-center gap-8'>
        <NewProjectCard
          Icon={Wand2}
          title="Generate with AI"
          description="Let AI create a professional draft for you in minutes"
          buttonText="Start with AI"
          onClick={handleAiClick}
          isRecommended={true}
        />
        <NewProjectCard
          Icon={PenSquare}
          title="Start From Scratch"
          description="Build your presentation slide by slide with our powerful and easy to use editor"
          buttonText="Create Manually"
          onClick={handleManualClick}
          isRecommended={false}
        />
      </div>
    </>
  )
}