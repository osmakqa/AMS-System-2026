
import React, { useState, useEffect } from 'react';
import { PHARMACISTS, IDS_SPECIALISTS, LOGO_URL } from '../constants';
import { User, UserRole } from '../types';
import { fetchUsers } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
  onOpenManual: () => void;
  onOpenWorkflow: () => void;
  onOpenAntimicrobialRequestForm: () => void;
  onOpenAuditForm: () => void; 
}

const Login: React.FC<LoginProps> = ({ onLogin, onOpenManual, onOpenWorkflow, onOpenAntimicrobialRequestForm, onOpenAuditForm }) => {
  const [role, setRole] = useState<'PHARMACIST' | 'IDS' | 'AMS' | 'RESIDENT'>('PHARMACIST');
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usersDb, setUsersDb] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
        const data = await fetchUsers();
        setUsersDb(data);
    };
    load();
  }, []);

  const getExpectedPassword = () => {
    // 1. Check if user exists in Firestore with a custom password
    const userId = (role === 'AMS') ? 'ams-admin' : (role === 'RESIDENT' ? 'resident' : selectedUser);
    const dbUser = usersDb.find(u => u.id === userId);
    if (dbUser && dbUser.password) return dbUser.password;

    // 2. Legacy hardcoded logic
    if (role === 'AMS') return 'ams123';
    if (role === 'RESIDENT') return 'doctor123';
    
    if (role === 'PHARMACIST' && selectedUser) {
      const lastName = selectedUser.split(',')[0].trim().toLowerCase().replace(/\s/g, '');
      return `${lastName}123`;
    }
    
    if (role === 'IDS' && selectedUser) {
      const parts = selectedUser.trim().split(' ');
      const lastName = parts[parts.length - 1].toLowerCase();
      return `${lastName}456`;
    }
    
    return '';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role !== 'AMS' && role !== 'RESIDENT' && !selectedUser) {
        setError('Please select a user');
        return;
    }

    const expected = getExpectedPassword();
    if (password !== expected) {
      setError('Incorrect password');
      return;
    }

    const userId = (role === 'AMS') ? 'ams-admin' : (role === 'RESIDENT' ? 'resident' : selectedUser);
    const dbUser = usersDb.find(u => u.id === userId);

    if (role === 'AMS') {
      onLogin(dbUser || { id: 'ams-admin', name: 'AMS Admin', role: UserRole.AMS_ADMIN });
      return;
    }

    if (role === 'RESIDENT') {
       onLogin(dbUser || { id: 'resident', name: 'Resident', role: UserRole.RESIDENT });
       return;
    }

    onLogin(dbUser || { 
      id: selectedUser, 
      name: selectedUser, 
      role: role === 'IDS' ? UserRole.IDS : UserRole.PHARMACIST 
    });
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#009a3e] p-6 flex items-center gap-4 h-20">
          <img src={LOGO_URL} alt="Logo" className="w-16 h-16 rounded-full p-1" />
          <div className="text-white">
            <h1 className="text-white font-bold text-xl tracking-wide uppercase">Ospital ng Makati</h1>
            <p className="text-white text-sm opacity-90 tracking-wide">Antimicrobial Stewardship System</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {/* Role Selection Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
            <button 
              type="button"
              className={`flex-1 py-2 px-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${role === 'PHARMACIST' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setRole('PHARMACIST'); setSelectedUser(''); }}
            >
              Pharmacist
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 px-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${role === 'IDS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setRole('IDS'); setSelectedUser(''); }}
            >
              IDS
            </button>
             <button 
              type="button"
              className={`flex-1 py-2 px-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${role === 'AMS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setRole('AMS'); setSelectedUser('Admin'); }}
            >
              AMS
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 px-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${role === 'RESIDENT' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setRole('RESIDENT'); setSelectedUser('Resident'); }}
            >
              Resident
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* User Select */}
            {(role === 'PHARMACIST' || role === 'IDS') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {role === 'IDS' ? 'Specialist' : 'Section User'}
                </label>
                <div className="relative">
                  <select
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md border bg-white text-black [color-scheme:light]"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="" disabled>Select Name</option>
                    {role === 'PHARMACIST' && PHARMACISTS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {role === 'IDS' && IDS_SPECIALISTS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                    type="password"
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white text-black"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#009a3e] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Login
            </button>
          </form>

           <div className="mt-8 space-y-3 pt-6 border-t border-gray-100">
             <button 
               className="w-full flex items-center p-3 border-2 border-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-all shadow-sm hover:shadow-md group text-left"
               onClick={onOpenAntimicrobialRequestForm}
             >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 mr-3 shadow-sm group-hover:scale-110 transition-transform border border-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-green-900 leading-tight">Submit New Antimicrobial Request</span>
                  <span className="text-xs text-green-700 opacity-90">For Residents</span>
                </div>
                <div className="ml-auto text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
             </button>

             {role === 'AMS' && (
                <button 
                  className="w-full flex items-center p-3 border-2 border-teal-500 bg-teal-50 rounded-xl hover:bg-teal-100 transition-all shadow-sm hover:shadow-md group text-left"
                  onClick={onOpenAuditForm}
                >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-600 mr-3 shadow-sm group-hover:scale-110 transition-transform border border-teal-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-teal-900 leading-tight">AMS Audit Tool</span>
                      <span className="text-xs text-teal-700 opacity-90">For Clinical Auditors</span>
                    </div>
                    <div className="ml-auto text-teal-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </button>
             )}

             <div className="flex flex-col gap-1 mt-2">
                 <button 
                   className="flex items-center justify-center w-full text-green-700 text-sm font-medium hover:underline gap-2 py-1"
                   onClick={onOpenWorkflow}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    View System Workflow
                 </button>
                <button 
                    className="flex items-center justify-center w-full text-green-700 text-sm font-medium hover:underline gap-2 py-1"
                    onClick={onOpenManual}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    View User Manual
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
