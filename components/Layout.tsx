
import React from 'react';
import { LOGO_URL } from '../constants';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  onOpenSettings?: () => void;
  children: React.ReactNode;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, onOpenSettings, children, tabs, activeTab, onTabChange }) => {
  const canAccessSettings = user.role === UserRole.PHARMACIST || user.role === UserRole.IDS;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-[#009a3e] text-white px-4 sm:px-6 lg:px-8 py-3 shadow-md">
        {/* Branding & Navigation Section */}
        <div className="flex items-center gap-8 overflow-hidden">
          {/* Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src={LOGO_URL} 
              alt="OsMak Logo" 
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="m-0 text-[10px] sm:text-sm tracking-wider uppercase font-bold leading-tight text-white truncate">
                OSPITAL NG MAKATI
              </h1>
              <span className="text-[8px] sm:text-xs text-white/80 leading-tight">
                Antimicrobial Stewardship
              </span>
            </div>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => onTabChange(tab)} 
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white text-[#009a3e] shadow-sm' 
                    : 'text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* User Info & Actions Section */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right hidden md:flex flex-col items-end border-r border-white/20 pr-4 mr-2">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/70 uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
          </div>

          {/* Settings Icon - Visible on ALL screen sizes for authorized roles */}
          {canAccessSettings && onOpenSettings && (
            <button 
              onClick={onOpenSettings}
              className="p-2 hover:bg-white/20 rounded-full transition-colors group flex items-center justify-center"
              title="Account Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          <button 
            onClick={onLogout}
            className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border border-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto hidden sm:block">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Ospital ng Makati. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
