import React from 'react';

// --- Type Definitions ---
interface NewProjectCardProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isRecommended: boolean;
}

// --- Component ---
export default function NewProjectCard({
  Icon,
  title,
  description,
  buttonText,
  onClick,
  isRecommended
}: NewProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className='group relative flex flex-col items-center text-center p-8 bg-white rounded-xl border border-gray-200 w-full max-w-sm cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:border-blue-400 hover:-translate-y-1'
    >
      {isRecommended && (
        <div className='absolute top-0 right-0 mt-4 mr-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full'>
          Recommended
        </div>
      )}

      <div className='mb-6 p-4 bg-blue-50 rounded-full'>
        <Icon className='w-10 h-10 text-blue-600' />
      </div>

      <h3 className='text-xl font-bold text-gray-900 mb-2'>
        {title}
      </h3>

      <p className='text-gray-600 mb-8 flex-grow'>
        {description}
      </p>

      <div className='w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-all duration-300 group-hover:bg-blue-700'>
        {buttonText}
      </div>
    </button>
  );
}