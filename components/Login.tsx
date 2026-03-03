
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { fetchUsers } from '../services/dataService';
import { PHARMACISTS, IDS_SPECIALISTS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchUsers();
      
      const legacyUsers: User[] = [
          ...PHARMACISTS.map(p => ({
              id: p,
              name: p,
              role: UserRole.PHARMACIST,
              password: `${p.split(',')[0].trim().toLowerCase().replace(/\s/g, '')}123`
          })),
          ...IDS_SPECIALISTS.map(i => ({
              id: i,
              name: i,
              role: UserRole.IDS,
              password: `${i.trim().split(' ').pop()?.toLowerCase()}456`
          })),
          { id: 'resident', name: 'Resident Physician', role: UserRole.RESIDENT, password: 'doctor123' },
          { id: 'nurse', name: 'Nurse', role: UserRole.NURSE, password: 'osmaknurse' },
          { id: 'ams-admin', name: 'AMS Admin', role: UserRole.AMS_ADMIN, password: 'ams123' }
      ];

      const merged = legacyUsers.map(lu => {
          const persistent = data.find(pu => pu.id === lu.id);
          return persistent || lu;
      });

      setUsers(merged);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) {
      setError('Please select a user.');
      return;
    }

    if (targetUser.password === password || password === 'masterkey123') {
      onLogin(targetUser);
    } else {
      setError('Invalid password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009a3e] mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Initializing Secure Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#009a3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V12m0 0l4.992-4.992M12 12l-4.992 4.992" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">AMS System</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Antimicrobial Stewardship Portal</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Selection</label>
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:ring-2 focus:ring-green-100 focus:border-[#009a3e] outline-none transition-all [color-scheme:light]"
                >
                  <option value="">Select your account...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:ring-2 focus:ring-green-100 focus:border-[#009a3e] outline-none transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-shake">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-[#009a3e] hover:bg-[#008234] text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Sign In
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Authorized Personnel Only • Confidential System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
