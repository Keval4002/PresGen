import React from 'react';

// --- Type Definitions ---
interface ITheme {
  slug: string;
  name: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
}

interface ThemeCardProps {
  theme: ITheme;
  isSelected: boolean;
  onClick: () => void;
}

// --- Component ---
export default function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition ${
        isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="mb-3 h-20 rounded-md overflow-hidden" style={{ backgroundColor: theme.background_color }}>
        <div className="p-3 h-full flex flex-col justify-between">
          <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: theme.primary_color }}></div>
          <div className="space-y-1">
            <div className="h-1 rounded-full w-full opacity-60" style={{ backgroundColor: theme.text_color }}></div>
            <div className="h-1 rounded-full w-2/3 opacity-40" style={{ backgroundColor: theme.text_color }}></div>
          </div>
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{theme.name}</h3>
      <p className="text-sm text-gray-600">{theme.description}</p>
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
      )}
    </div>
  );
}