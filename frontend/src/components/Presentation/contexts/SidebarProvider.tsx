'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context's value for type safety
interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// Create the Context with a specific type and a default value
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Define the props for the Provider component
interface SidebarProviderProps {
  children: ReactNode;
}

// Create the Provider Component
export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const value: SidebarContextType = {
    isCollapsed,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// Create a custom hook for easy access to the context
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}