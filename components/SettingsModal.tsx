
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { updateUserAccount } from '../services/dataService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onPasswordChange: (newPassword: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onPasswordChange }) => {
  const [step, setStep] = useState<'menu' | 'change-password'>('menu');
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Derive current expected password logic based on role-specific legacy defaults
  const getLegacyPassword = () => {
    if (user.role === UserRole.PHARMACIST) {
      return `${user.name.split(',')[0].trim().toLowerCase().replace(/\s/g, '')}123`;
    }
    if (user.role === UserRole.IDS) {
      const parts = user.name.trim().split(' ');
      const lastName = parts[parts.length - 1].toLowerCase();
      return `${lastName}456`;
    }
    return 'osmak123';
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const currentPass = user.password || getLegacyPassword();
    
    if (passForm.old !== currentPass) {
        setError("Old password does not match.");
        return;
    }
    if (passForm.new.length < 4) {
        setError("New password must be at least 4 characters.");
        return;
    }
    if (passForm.new !== passForm.confirm) {
        setError("Passwords do not match.");
        return;
    }

    setLoading(true);
    try {
        await updateUserAccount(user.id, { 
            id: user.id, 
            name: user.name, 
            role: user.role, 
            password: passForm.new 
        });
        onPasswordChange(passForm.new);
        alert("Password changed successfully.");
        onClose();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[160] p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-gray-100" onClick={e => e.stopPropagation()}>
        <header className="bg-emerald-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-black uppercase tracking-tight text-sm">Account Settings</h3>
            <button onClick={onClose} className="text-white/60 hover:text-white"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <div className="p-6">
            {step === 'menu' ? (
                <div className="space-y-3">
                    <button 
                        onClick={() => setStep('change-password')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-900 leading-tight">Change Password</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">Update your login credentials</p>
                            </div>
                        </div>
                        <svg className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-fade-in">
                    <button onClick={() => setStep('menu')} type="button" className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline mb-2">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Settings
                    </button>
                    
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Old Password</label>
                        <input required type="password" value={passForm.old} onChange={e => setPassForm({...passForm, old: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">New Password</label>
                        <input required type="password" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Confirm New Password</label>
                        <input required type="password" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg text-center">{error}</p>}

                    <button 
                        disabled={loading}
                        type="submit" 
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Update & Approve'}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
