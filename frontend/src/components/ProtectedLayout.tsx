import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const sidebarOffsetClass = 'ml-0 sm:ml-72';

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />
        <main
          data-sidebar-open={sidebarOpen ? 'true' : 'false'}
          className={`app-main-container flex-1 overflow-auto bg-gray-50 transition-all duration-300 dark:bg-gray-900 ${sidebarOpen ? sidebarOffsetClass : 'ml-14 sm:ml-16'}`}
        >
          <div className="app-main-content p-4 sm:p-5 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
