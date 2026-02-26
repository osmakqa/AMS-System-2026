import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expectedPassword: string;
  title?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onConfirm, expectedPassword, title }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      setError(false);
      setPassword('');
      onConfirm();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="bg-gray-800 p-5 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase tracking-tight text-lg leading-tight">{title || 'Security Verification'}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Authorized Personnel Only</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-all">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Enter Password</label>
            <input 
              autoFocus
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 outline-none transition-all ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-200'}`}
              placeholder="••••••••"
            />
            {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Incorrect password. Access denied.</p>}
          </div>
          
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-all border border-gray-200">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-900 transition-all">Verify</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
