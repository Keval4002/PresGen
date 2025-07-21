'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Plus, Mic, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

// Add a helper for authenticated fetch
function authFetch(url: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
}

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [projects, setProjects] = useState<{ title?: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<{ title?: string }[]>([]);
  const dropdownRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch all saved projects on mount
    authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/active`)
      .then(res => res.json())
      .then(data => setProjects(data || []));
  }, []);

  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = projects.filter((p) =>
        p.title && p.title.toLowerCase().includes(searchValue.trim().toLowerCase())
      );
      setFilteredProjects(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredProjects([]);
      setShowDropdown(false);
    }
  }, [searchValue, projects]);

  useEffect(() => {
    // Hide dropdown on outside click
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && (dropdownRef.current as HTMLElement).contains && !(dropdownRef.current as HTMLElement).contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Only update the search param and dispatch event for live filtering
      window.dispatchEvent(new CustomEvent('navbar-search', { detail: searchValue }));
      const url = new URL(window.location.href);
      if (searchValue.trim()) {
        url.searchParams.set('search', searchValue.trim());
      } else {
        url.searchParams.delete('search');
      }
      window.history.replaceState({}, '', url.toString());
      setShowDropdown(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    router.push(`/presentation/${projectId}`);
    setShowDropdown(false);
    setSearchValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // Dispatch custom event for live filtering
    window.dispatchEvent(new CustomEvent('navbar-search', { detail: e.target.value }));
    // Update the URL search param for consistency
    const url = new URL(window.location.href);
    if (e.target.value.trim()) {
      url.searchParams.set('search', e.target.value.trim());
    } else {
      url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('ppt', file);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/templates/import`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to import PPT');
      // Optionally, show a success message or refresh templates
      window.location.reload();
    } catch (err) {
      alert('Failed to import PPT. Please try again.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNewProject = () => {
    router.push('/presentation/new');
    console.log('Project started');
  };

  // Determine banner label
  let bannerLabel = 'Projects';
  if (pathname && pathname.includes('/presentation/trash')) {
    bannerLabel = 'Trash';
  } else if (pathname && pathname.includes('/presentation/templates')) {
    bannerLabel = 'Templates';
  }

  return (
    <header className="w-full bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center w-full gap-3">
        {/* Banner at start of navbar, stretched */}
        <span className="select-none pointer-events-none flex-shrink-0 min-w-[120px] md:min-w-[200px] px-4 md:px-6 h-10 flex items-center rounded-full bg-gradient-to-r from-blue-100 via-white to-cyan-100 text-lg font-bold text-gray-800 shadow-sm">
          {bannerLabel}
        </span>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden ml-auto p-2 rounded-full hover:bg-gray-100 focus:outline-none"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Open menu"
        >
          <Menu className="w-7 h-7 text-gray-700" />
        </button>
        {/* Desktop search and actions */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center bg-white rounded-full border border-gray-200 w-full max-w-2xl h-12 px-4 focus-within:ring-2 focus-within:ring-blue-400">
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(filteredProjects.length > 0)}
              onKeyDown={handleSearch}
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
              autoComplete="off"
              style={{ minWidth: 0 }}
            />
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              tabIndex={-1}
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        {/* Desktop Create/Import Button */}
        <div className="hidden md:flex items-center">
          {pathname && pathname.includes('/presentation/templates') ? (
            <>
              <input
                type="file"
                accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                title="Import PPT Template"
                placeholder="Select a PPT or PPTX file"
              />
              <button
                onClick={handleImport}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-6 h-12 font-semibold text-base shadow hover:bg-blue-700 transition-colors ml-2 disabled:opacity-50"
                title="Import Template"
                aria-label="Import Template"
                style={{ whiteSpace: 'nowrap' }}
                disabled={importing}
              >
                <Upload className="w-5 h-5" />
                {importing ? 'Importing...' : 'Import'}
              </button>
            </>
          ) : (
            <button
              onClick={handleNewProject}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-6 h-12 font-semibold text-base shadow hover:bg-blue-700 transition-colors ml-2"
              title="Create New Project"
              aria-label="Create New Project"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Plus className="w-5 h-5" />
              Create
            </button>
          )}
        </div>
      </div>
      {/* Mobile menu popover */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 absolute left-0 right-0 mx-2 animate-fade-in">
          <div className="flex flex-col gap-3">
            <div className="flex items-center bg-white rounded-full border border-gray-200 w-full h-12 px-4 focus-within:ring-2 focus-within:ring-blue-400">
              <input
                type="text"
                placeholder="Search"
                value={searchValue}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(filteredProjects.length > 0)}
                onKeyDown={handleSearch}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                autoComplete="off"
                style={{ minWidth: 0 }}
              />
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                tabIndex={-1}
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {pathname && pathname.includes('/presentation/templates') ? (
              <>
                <input
                  type="file"
                  accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  title="Import PPT Template"
                  placeholder="Select a PPT or PPTX file"
                />
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-6 h-12 font-semibold text-base shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                  title="Import Template"
                  aria-label="Import Template"
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={importing}
                >
                  <Upload className="w-5 h-5" />
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </>
            ) : (
              <button
                onClick={handleNewProject}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-6 h-12 font-semibold text-base shadow hover:bg-blue-700 transition-colors"
                title="Create New Project"
                aria-label="Create New Project"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus className="w-5 h-5" />
                Create
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;