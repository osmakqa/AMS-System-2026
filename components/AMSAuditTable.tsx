

import React from 'react';
import { AMSAudit } from '../types';

interface AMSAuditTableProps {
  items: AMSAudit[];
  onView: (audit: AMSAudit) => void;
  onEdit: (audit: AMSAudit) => void;
}

const AMSAuditTable: React.FC<AMSAuditTableProps> = ({ items, onView, onEdit }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
        <p className="text-gray-500">No AMS Audit records found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Antimicrobials</th>
              
              {/* Separate Columns for Notes vs Findings */}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Auditor Notes</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Review Findings</th>
              
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((audit) => {
              const abxCount = audit.antimicrobials?.length || 0;
              const drugNames = audit.antimicrobials?.map((a: any) => a.drug).join(', ') || 'None';
              
              // Check for Auditor Notes (General Note OR Any Drug Note)
              const hasAuditorNotes = (audit.general_audit_note && audit.general_audit_note.trim() !== '') || (audit.antimicrobials?.some((a: any) => a.auditNote && a.auditNote.trim() !== ''));
              
              // Check for Review Findings
              const findingsCount = audit.audit_findings && Array.isArray(audit.audit_findings) ? audit.audit_findings.length : 0;
              const hasFindings = findingsCount > 0;

              return (
                <tr key={audit.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onView(audit)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(audit.audit_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{audit.auditor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{audit.patient_hosp_no}</div>
                      <div className="text-xs">{audit.patient_age_string}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    <span className="font-medium text-gray-900">({abxCount})</span> <span className="text-gray-500">{drugNames}</span>
                  </td>
                  
                  {/* Auditor Notes Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                      {hasAuditorNotes ? (
                          <span className="inline-flex items-center justify-center p-1.5 rounded-full bg-amber-100 text-amber-600" title="Auditor has added notes">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          </span>
                      ) : <span className="text-gray-300">-</span>}
                  </td>

                  {/* Review Findings Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                      {hasFindings ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                              {findingsCount} Finding{findingsCount !== 1 ? 's' : ''}
                          </span>
                      ) : <span className="text-gray-300">-</span>}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                        <button onClick={(e) => { e.stopPropagation(); onView(audit); }} className="text-amber-600 hover:text-amber-900 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Review
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(audit); }} className="text-blue-600 hover:text-blue-900 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AMSAuditTable;