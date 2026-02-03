
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { fetchUsers } from '../services/dataService';
import { PHARMACISTS, IDS_SPECIALISTS } from '../constants';

const PasswordManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchUsers();
      
      // Merge with hardcoded logic for display if they haven't logged in/migrated yet
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
          { id: 'resident', name: 'Resident (Global)', role: UserRole.RESIDENT, password: 'doctor123' },
          { id: 'ams-admin', name: 'AMS Admin', role: UserRole.AMS_ADMIN, password: 'ams123' }
      ];

      // Prefer persistent users
      const merged = legacyUsers.map(lu => {
          const persistent = data.find(pu => pu.id === lu.id);
          return persistent || lu;
      });

      setUsers(merged);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    const base = "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest";
    switch(role) {
      case UserRole.PHARMACIST: return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
      case UserRole.IDS: return `${base} bg-purple-100 text-purple-800 border border-purple-200`;
      case UserRole.AMS_ADMIN: return `${base} bg-red-100 text-red-800 border border-red-200`;
      case UserRole.RESIDENT: return `${base} bg-green-100 text-green-800 border border-green-200`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in">
        <header className="bg-gray-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Password Manager</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Administrative access control</p>
                </div>
            </div>
            <div className="relative w-full md:w-64">
                <input 
                    type="text" 
                    placeholder="Search accounts..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border-none rounded-xl text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
        </header>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Type</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Password</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">Synchronizing security database...</td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">No matching accounts found.</td></tr>
                    ) : filtered.map((u, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900">{u.name}</div>
                                <div className="text-[10px] font-mono text-gray-400">ID: {u.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getRoleBadge(u.role)}>{u.role.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 group">
                                    <div className="bg-gray-100 border border-gray-200 px-3 py-1 rounded font-mono text-sm text-emerald-700 font-bold">
                                        {u.password}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(u.password || '');
                                            alert("Password copied to clipboard");
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-emerald-600 transition-all"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <footer className="p-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Confidential - For AMS Administrator use only</p>
        </footer>
    </div>
  );
};

export default PasswordManager;
