

import React, { useState, useEffect } from 'react';
import { AMSAudit } from '../types';
import AMSAuditSummary from './AMSAuditSummary';
import { updateAudit } from '../services/dataService';

interface AMSAuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: AMSAudit | null;
  onSave?: () => void;
}

const AMSAuditDetailModal: React.FC<AMSAuditDetailModalProps> = ({ isOpen, onClose, audit, onSave }) => {
  const [editedGeneralNote, setEditedGeneralNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (audit && isOpen) {
        setEditedGeneralNote(audit.general_audit_note || '');
    }
  }, [audit, isOpen]);

  if (!isOpen || !audit) return null;

  const handleSaveGeneralNote = async () => {
    setIsSaving(true);
    try {
        await updateAudit(audit.id, { general_audit_note: editedGeneralNote });
        if (onSave) onSave();
        alert("General Audit Note saved successfully!");
    } catch (e) {
        console.error(e);
        alert("Failed to save note. Please check your internet connection.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex justify-between items-center text-white shadow-md">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Audit Record #{audit.id}
                </h3>
            </div>
            <div className="flex gap-2">
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <AMSAuditSummary data={audit} />
            
            {/* Edit General Note Section */}
            <div className="mt-8 bg-white p-5 rounded-xl shadow-sm border border-amber-200">
                <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    Edit General Audit Notes
                </h4>
                <textarea 
                    className="w-full border border-amber-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    rows={4}
                    placeholder="Enter general observations or summary for this audit..."
                    value={editedGeneralNote}
                    onChange={(e) => setEditedGeneralNote(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                    <button 
                        onClick={handleSaveGeneralNote} 
                        disabled={isSaving}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : 'Save Note'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    </button>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
            <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AMSAuditDetailModal;