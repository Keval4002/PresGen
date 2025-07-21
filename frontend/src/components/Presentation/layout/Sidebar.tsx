'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronFirst, ChevronLast, User2, Home, Trash2, 
  Clock, ChevronDown, ChevronRight, LayoutGrid 
} from 'lucide-react';
// Remove the logo import
// import logo from '../../../../public/images/PresGenLogo.png';
import { useSidebar } from '../contexts/SidebarProvider';

// --- Type Definitions ---
interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface RecentlyViewedItem {
  id: string;
  name: string;
  date: string;
  status?: string;
}

interface User {
  name: string;
  email: string;
}

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

// --- Component ---
function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [isRecentlyViewedOpen, setIsRecentlyViewedOpen] = useState(true);

  const navigationItems: readonly NavItem[] = [
    // { icon: LayoutGrid, label: "Dashboard", path: '/dashboard' },
    { icon: Home, label: "Home", path: '/presentation' },
    // { icon: LayoutGrid, label: "Templates", path: '/presentation/templates' },
    { icon: Trash2, label: "Trash", path: '/presentation/trash' }
  ];

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/sidebar`);
        const data = await res.json();
        if (data.recentlyViewed) {
          setRecentlyViewedItems(data.recentlyViewed);
        }
      } catch (err) {
        console.error("Sidebar data fetch error:", err);
      }
    };
    fetchSidebarData();
  }, []);

  useEffect(() => {
    if (userLoaded) return;

    const cachedUser = localStorage.getItem('userData');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setUserLoaded(true);
        return;
      } catch (err) {
        localStorage.removeItem('userData');
      }
    }

    const fetchUser = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/user`);
        const data = await res.json();
        const userData: User = { name: data.name, email: data.email };
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (err) {
        console.error("User fetch error:", err);
        setUser({ name: "Error loading user", email: "" });
      } finally {
        setUserLoaded(true);
      }
    };
    
    fetchUser();
  }, [userLoaded]);

  const handleNavigationClick = (path: string) => {
    router.push(path);
  };

  const toggleRecentlyViewed = () => {
    if (!isCollapsed) {
      setIsRecentlyViewedOpen(prev => !prev);
    }
  };

  return (
    <aside className={`h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-48'}`}>
      <nav className="h-full flex flex-col">
        <div className={`p-4 flex items-center justify-between ${isCollapsed ? 'px- 1' : 'px-2'}`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="flex items-center">
              <svg
                viewBox="0 0 120 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-auto"
                aria-label="PresGen logo"
                role="img"
              >
                <rect x="0" y="4" rx="12" width="120" height="24" fill="#f9fafb"/>
                <text x="16" y="24" fontFamily="Inter, Arial, sans-serif" fontWeight="bold" fontSize="20">
                  <tspan fill="#1d4ed8">Pres</tspan><tspan fill="#fb923c">Gen</tspan>
                </text>
              </svg>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100">
            {isCollapsed ? <ChevronLast className="w-5 h-5" /> : <ChevronFirst className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 py-6">
          <nav className="px-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigationClick(item.path)}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-lg transition-all text-left ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`font-medium transition-all ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.label}</span>
                </button>
              );
            })}
            
            <div className="pt-6">
              <button
                onClick={toggleRecentlyViewed}
                disabled={isCollapsed}
                className={`w-full flex items-center gap-2 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 ${isCollapsed ? 'justify-center cursor-not-allowed' : ''}`}
                style={{ minHeight: 'unset' }}
              >
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium transition-all ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Recently</span>
                {!isCollapsed && (isRecentlyViewedOpen ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />)}
              </button>
              <div className={`overflow-hidden transition-all ${isRecentlyViewedOpen && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}>
                <div className="mt-1 flex flex-col gap-0.5 pl-6">
                  {recentlyViewedItems.map((item) => (
                    <button
                      key={item.id}
                      className="w-full px-0 py-1 text-left hover:bg-gray-50 rounded flex items-center truncate"
                      style={{ fontSize: '0.85rem', minHeight: 'unset' }}
                      title={item.name}
                    >
                      <span className="truncate text-gray-400 font-normal" style={{ letterSpacing: 0 }}>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
{/* 
        <div className="border-t border-gray-100 p-3">
          <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User2 className="w-4 h-4 text-gray-600" />
            </div>
            <div className={`transition-all overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <div className="text-sm font-medium text-gray-900">{!userLoaded ? "Loading..." : (user ? user.name : "Error")}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email || ""}</div>
            </div>
          </div>
        </div> */}
      </nav>
    </aside>
  );
}

export default Sidebar;