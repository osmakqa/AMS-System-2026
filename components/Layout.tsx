import React from 'react';
import { LOGO_URL } from '../constants';
import { User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, tabs, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-[#009a3e] text-white px-4 sm:px-6 lg:px-8 py-3 shadow-md">
        {/* Branding & Navigation Section */}
        <div className="flex items-center gap-8">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="OsMak Logo" 
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="m-0 text-sm tracking-wider uppercase font-bold leading-tight text-white">
                OSPITAL NG MAKATI
              </h1>
              <span className="text-xs text-white/80 leading-tight">
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
        
        {/* User Info & Logout Button */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/70">{user.role.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={onLogout}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
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