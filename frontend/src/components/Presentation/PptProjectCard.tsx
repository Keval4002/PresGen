'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, RotateCcw, Trash } from 'lucide-react';

interface ProjectCardProps {
  imageUrl: string;
  title: string;
  lastModified?: string;
  status: 'active' | 'trashed' | 'deleted';
  onDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  onOpen?: () => void;
  isTemplate?: boolean;
}

export default function ProjectCard({
  imageUrl,
  title,
  lastModified,
  status,
  onDelete,
  onRestore,
  onPermanentDelete,
  onOpen,
  isTemplate = false
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    if (showMenu) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const openMenu = () => {
    setShowMenu(true);
    setIsMenuAnimating(true);
  };

  const closeMenu = () => {
    setIsMenuAnimating(false);
    setTimeout(() => setShowMenu(false), 150);
  };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (showMenu) closeMenu();
    else openMenu();
  };

  const handleMenuAction = (action: (() => void) | undefined, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    closeMenu();
    if (action) {
      setTimeout(() => action(), 100);
    }
  };

  const handleCardClick = () => {
    if (!showMenu && onOpen) {
      onOpen();
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const nextSibling = target.nextElementSibling as HTMLElement | null;
    if (nextSibling) {
      nextSibling.style.display = 'flex';
    }
  };

  return (
    <div
      className={`group w-full rounded-lg overflow-visible border border-gray-100 bg-white hover:shadow transition-all duration-200 relative cursor-pointer mb-1 ${isTemplate ? 'template-card' : ''}`}
      onClick={!isTemplate && onOpen ? handleCardClick : undefined}
      style={isTemplate ? { margin: '16px' } : {}}
    >
      <div className={`relative w-full ${isTemplate ? 'aspect-[4/3]' : 'aspect-[16/9]'} bg-gray-50 rounded-t-lg`} style={isTemplate ? { minHeight: 180, maxHeight: 260 } : { minHeight: 80, maxHeight: 110 }}>
        <img
          src={imageUrl}
          alt={`Cover for ${title}`}
          className="w-full h-full object-contain rounded-t-lg"
          onError={handleImageError}
          style={isTemplate ? { minHeight: 180, maxHeight: 260 } : { minHeight: 80, maxHeight: 110 }}
        />
        {/* Template title overlay on hover */}
        {isTemplate && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
            <span className="text-white text-lg font-semibold px-4 py-2 rounded-lg bg-black/70 max-w-[90%] truncate" title={title}>{title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 hidden items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl mb-1">📄</div>
            <div className="text-xs font-medium">{title}</div>
          </div>
        </div>
        {!isTemplate && (
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button onClick={onOpen} className="px-3 py-1 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-xs">
              Open
            </button>
          </div>
        )}
      </div>

      <div className="p-2 flex justify-between items-start relative z-10">
        <div className="flex-1 min-w-0 pr-2">
          {/* Hide title for template cards */}
          {!isTemplate && <h3 className="font-semibold text-gray-800 truncate text-sm">{title}</h3>}
          {!isTemplate && <p className="text-[10px] text-gray-400 mt-0.5">Modified: {lastModified}</p>}
        </div>

        {!isTemplate && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              ref={buttonRef}
              className={`p-1 rounded-full transition-all ${showMenu ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
              onClick={toggleMenu}
              aria-label="More options"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div
                className={`absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] transform origin-top-right transition-all duration-200 ease-out ${
                  isMenuAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className="py-1">
                  {status === 'active' ? (
                    <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 group" onClick={(e) => handleMenuAction(onDelete, e)}>
                      <Trash2 size={12} className="text-gray-400 group-hover:text-red-500" />
                      <span>Move to Trash</span>
                    </button>
                  ) : (
                    <>
                      <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 group" onClick={(e) => handleMenuAction(onRestore, e)}>
                        <RotateCcw size={12} className="text-gray-400 group-hover:text-blue-500" />
                        <span>Restore</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-1"></div>
                      <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 group" onClick={(e) => handleMenuAction(onPermanentDelete, e)}>
                        <Trash size={12} className="text-gray-400 group-hover:text-red-500" />
                        <span>Delete Forever</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
