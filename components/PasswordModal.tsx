
import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  expectedPassword?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  expectedPassword = "osmak123" // Fallback default
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      onConfirm();
      onClose();
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">Please enter your password to proceed.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
