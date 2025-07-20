// src/components/PropertyPanel/CollapsibleSection.tsx
'use client';
import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  title: React.ReactNode;
  iconColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function CollapsibleSection({
  title,
  iconColor = 'bg-blue-600',
  defaultOpen = true,
  children,
  isOpen: controlledIsOpen,
  onToggle,
}: Props) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
  const handleToggle = onToggle || (() => setUncontrolledIsOpen((v) => !v));

  return (
    <div>
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left rounded-md bg-gray-100 hover:bg-gray-200 transition"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${iconColor}`} />
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""} text-gray-500`} />
        ) : (
          <ChevronRight className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""} text-gray-500`} />
        )}
      </button>
      {isOpen && <div className="px-3 py-2 mt-1 space-y-2 bg-white rounded-md border border-gray-100 shadow-sm">{children}</div>}
    </div>
  );
}
