import React, { useState } from 'react';

interface DisapproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  loading: boolean;
}

// SVG Icon for the header
const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

// Custom styled radio button component
const ReasonOption: React.FC<{ value: string, selectedReason: string, onChange: (val: string) => void, children: React.ReactNode, key?: React.Key }> = ({ value, selectedReason, onChange, children }) => (
  <label className={`
    flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
    ${selectedReason === value 
      ? 'bg-red-50 border-red-500 shadow-inner' 
      : 'bg-white border-gray-200 hover:border-red-300'}
  `}>
    <input
      type="radio"
      name="reason"
      value={value}
      checked={selectedReason === value}
      onChange={() => onChange(value)}
      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
    />
    <span className={`ml-3 font-medium ${selectedReason === value ? 'text-red-800' : 'text-gray-700'}`}>{children}</span>
  </label>
);

const DisapproveModal: React.FC<DisapproveModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState(''); // Start with no selection
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const reasons = [
    'Wrong Choice',
    'Wrong Dose',
    'Wrong Route',
    'Wrong Duration',
    'No Infection',
    'Others'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
        alert("Please select a reason for disapproval.");
        return;
    }
    onSubmit(reason, details);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
            <WarningIcon />
            <h3 className="text-xl font-bold text-gray-800">Reason for Disapproval</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Reason Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {reasons.map(r => (
              <ReasonOption key={r} value={r} selectedReason={reason} onChange={setReason}>{r}</ReasonOption>
            ))}
          </div>

          {/* Details Textarea */}
          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
              Details / Remarks {reason === 'Others' && <span className="text-red-500">(Required)</span>}
            </label>
            <textarea
              id="details"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors bg-white text-gray-900 ${reason === 'Others' ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-green-300'}`}
              placeholder="Provide specific details to guide the requester..."
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required={reason === 'Others'}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold shadow-sm transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Confirm Disapproval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisapproveModal;