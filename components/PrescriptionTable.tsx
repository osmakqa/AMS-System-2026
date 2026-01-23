
import React, { useState, useMemo } from 'react';
import { Prescription, PrescriptionStatus, ActionType } from '../types';

interface PrescriptionTableProps {
  items: Prescription[];
  onAction: (id: string, action: ActionType) => void;
  onView: (item: Prescription) => void;
  statusType: PrescriptionStatus | 'ALL_VIEW';
  isHistoryView?: boolean;
}

const PrescriptionTable: React.FC<PrescriptionTableProps> = ({ items, onAction, onView, statusType, isHistoryView = false }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Prescription | 'req_date' | 'request_number', direction: 'asc' | 'desc' }>({ key: 'request_number', direction: 'desc' });

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Prescription] || '';
        const bVal = b[sortConfig.key as keyof Prescription] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof Prescription) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Prescription) => {
    if (sortConfig.key !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="text-green-600 ml-1">↑</span> : <span className="text-green-600 ml-1">↓</span>;
  };

  /**
   * Helper to determine rowSpan for the Patient column.
   * If the current item is identical to the previous one (Name + Hospital Number), span is 0 (cell skipped).
   * Otherwise, count how many following items are the same.
   */
  const getPatientRowSpan = (index: number) => {
    const current = sortedItems[index];
    
    // If same as previous, this cell is already spanned from above
    if (index > 0) {
      const prev = sortedItems[index - 1];
      if (prev.patient_name === current.patient_name && prev.hospital_number === current.hospital_number) {
        return 0;
      }
    }

    // Count identical adjacent rows
    let span = 1;
    for (let i = index + 1; i < sortedItems.length; i++) {
      const next = sortedItems[i];
      if (next.patient_name === current.patient_name && next.hospital_number === current.hospital_number) {
        span++;
      } else {
        break;
      }
    }
    return span;
  };

  if (items.length === 0) return <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">No records found.</div>;
  
  const formatStatus = (status: string) => {
    if (!status) return 'N/A';
    if (status === 'for_ids_approval') return 'For IDS Approval';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string) => {
      const s = status.toLowerCase();
      if (s === 'approved') return 'text-green-800 bg-green-100';
      if (s === 'disapproved') return 'text-red-800 bg-red-100';
      if (s === 'for_ids_approval') return 'text-yellow-800 bg-yellow-100';
      return 'text-gray-800 bg-gray-100';
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 border-collapse relative">
          <thead className="bg-green-50 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider cursor-pointer select-none hover:bg-green-100" onClick={() => requestSort('request_number' as any)}>Req # {getSortIcon('request_number' as any)}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider cursor-pointer select-none hover:bg-green-100" onClick={() => requestSort('req_date')}>Date {getSortIcon('req_date')}</th>
              {isHistoryView && (
                <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Time</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider cursor-pointer select-none hover:bg-green-100" onClick={() => requestSort('patient_name')}>Patient {getSortIcon('patient_name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider cursor-pointer select-none hover:bg-green-100" onClick={() => requestSort('antimicrobial')}>Antimicrobial {getSortIcon('antimicrobial')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider cursor-pointer select-none hover:bg-green-100" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider cursor-pointer select-none hover:bg-green-100" onClick={() => requestSort('resident_name')}>In-Charge {getSortIcon('resident_name')}</th>
              {!isHistoryView && (
                <th className="px-6 py-3 text-right text-xs font-medium text-green-800 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item, index) => {
              const patientSpan = getPatientRowSpan(index);
              const isWithinGroup = patientSpan === 0;

              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${isWithinGroup ? 'bg-gray-50/30' : ''}`} 
                  onClick={() => onView(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">#{item.request_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.req_date ? new Date(item.req_date).toLocaleDateString() : '-'}</td>
                  
                  {isHistoryView && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(item.created_at)}
                    </td>
                  )}

                  {/* Patient Column with Spanning */}
                  {patientSpan > 0 ? (
                    <td 
                      rowSpan={patientSpan} 
                      className={`px-6 py-4 whitespace-nowrap bg-white align-top border-r border-gray-100 ${patientSpan > 1 ? 'shadow-[inset_-2px_0_4px_-2px_rgba(0,0,0,0.05)]' : ''}`}
                    >
                      <div className="text-sm font-bold text-gray-900">{item.patient_name}</div>
                      <div className="text-xs font-mono text-gray-500">{item.hospital_number}</div>
                      {patientSpan > 1 && (
                        <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tighter">
                          {patientSpan} Rx Group
                        </div>
                      )}
                    </td>
                  ) : null}

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{item.antimicrobial}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.drug_type === 'Restricted' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.drug_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(item.status)}`}>
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.resident_name || item.requested_by}</td>
                  
                  {!isHistoryView && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2 items-center">
                        {statusType === PrescriptionStatus.APPROVED && (
                          <button onClick={() => onAction(item.id, ActionType.REVERSE_TO_DISAPPROVE)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded text-xs font-bold transition-colors">Disapprove</button>
                        )}
                        {statusType === PrescriptionStatus.DISAPPROVED && (
                          <button onClick={() => onAction(item.id, ActionType.REVERSE_TO_APPROVE)} className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1 rounded text-xs font-bold transition-colors">Approve</button>
                        )}
                        {statusType === PrescriptionStatus.FOR_IDS_APPROVAL && (
                          <button onClick={() => onAction(item.id, ActionType.REVERSE_TO_DISAPPROVE)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded text-xs font-bold transition-colors">Disapprove</button>
                        )}
                        
                        {statusType === 'ALL_VIEW' && (
                          <button className="text-gray-400 text-xs font-medium cursor-not-allowed italic" disabled>View Only</button>
                        )}

                        <button onClick={() => onAction(item.id, ActionType.DELETE)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrescriptionTable;
