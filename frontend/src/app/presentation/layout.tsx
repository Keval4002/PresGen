'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../components/Presentation/layout/Sidebar';
import Navbar from '../../components/Presentation/layout/Navbar';
import { SidebarProvider } from '../../components/Presentation/contexts/SidebarProvider';
import '../globals.css';

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  // const showLayout = pathname === '/presentation' || pathname === '/presentation/new' || pathname === '/presentation/trash' || pathname === '/presentation/templates';
  // Commented out templates logic
  const showLayout = pathname === '/' || pathname === '/presentation' || pathname === '/presentation/new' || pathname === '/presentation/trash';
  const showNavbar = pathname !== '/presentation/new';

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect x='3' y='6' width='42' height='32' rx='6' fill='white' stroke='%231d4ed8' stroke-width='3'/%3E%3Ccircle cx='13' cy='32' r='4' fill='%23fb923c'/%3E%3C/svg%3E" />
      </head>
      <body>
        <SidebarProvider>
          {showLayout?(
          <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              {showNavbar && <Navbar />}
              {/* The <main> tag provides consistent padding and scrolling for all child pages */}
              <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white">
                {children}
              </main>
            </div>
          </div>
          ):(
            <>{children}</>
          )}
        </SidebarProvider>
      </body>
    </html>
  );
}