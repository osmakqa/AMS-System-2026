import React from 'react';
import { Prescription, DrugType, PrescriptionStatus, UserRole, ActionType } from '../types';

interface PrescriptionCardProps {
  item: Prescription;
  onAction: (id: string, action: ActionType, payload?: any) => void;
  onView: (item: Prescription) => void;
  role: string;
}

const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ForwardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ item, onAction, onView, role }) => {
  const isRestricted = item.drug_type === DrugType.RESTRICTED;

  const cardBorderColor = isRestricted ? 'border-red-500' : 'border-blue-500';
  const btnBase = "flex items-center justify-center py-2.5 px-3 rounded-lg font-bold text-xs transition-all duration-200 ease-in-out shadow-md hover:shadow-lg hover:-translate-y-0.5";
  
  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return null;
    }
  };

  return (
    <div 
      className={`bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-white/30 border-l-4 ${cardBorderColor} p-5 relative transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer flex flex-col overflow-hidden`}
      onClick={() => onView(item)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {item.arf_number ? (
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-tighter">ARF-{String(item.arf_number).padStart(4, '0')}</span>
                ) : (
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">#{item.request_number || 'DEL'}</span>
                )}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isRestricted ? 'text-red-600' : 'text-blue-600'}`}>{item.drug_type}</span>
            </div>
        </div>
        <div className="text-right">
            <div className="text-xs font-medium text-gray-500">{item.req_date ? new Date(item.req_date).toLocaleDateString() : 'No Date'}</div>
            {item.created_at && (
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tight mt-0.5">
                    {formatTime(item.created_at)}
                </div>
            )}
        </div>
      </div>

      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent truncate">{item.patient_name}</h3>
      <p className="text-sm text-gray-600 mb-4">ID: {item.hospital_number} • Ward: {item.ward || 'N/A'}</p>
      
      <div className="p-4 rounded-lg mb-5 bg-black/5">
        <div className="flex items-center">
            <span className="text-sm font-bold text-green-700 mr-2">Rx:</span>
            <p className="text-md font-semibold text-gray-800 flex-1 truncate">{item.antimicrobial}</p>
        </div>
        <p className="text-xs text-gray-600 mt-2 truncate">
          From: {item.resident_name || 'N/A'} ({item.clinical_dept || 'N/A'})
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
        {role === UserRole.PHARMACIST && item.status === PrescriptionStatus.PENDING && (
          <>
            {isRestricted ? (
              <>
                <button onClick={() => onAction(item.id, ActionType.FORWARD_IDS)} className={`flex-1 ${btnBase} bg-indigo-600 text-white hover:bg-indigo-700`}><ForwardIcon/> For IDS Approval</button>
                <button onClick={() => onAction(item.id, ActionType.DISAPPROVE)} className={`flex-1 ${btnBase} bg-white text-red-600 border border-red-200 hover:bg-red-50`}><XIcon/> Disapprove</button>
              </>
            ) : (
              <>
                <button onClick={() => onAction(item.id, ActionType.APPROVE)} className={`flex-1 ${btnBase} bg-green-600 text-white hover:bg-green-700`}><CheckIcon/> Approve</button>
                <button onClick={() => onAction(item.id, ActionType.DISAPPROVE)} className={`flex-1 ${btnBase} bg-white text-red-600 border border-red-200 hover:bg-red-50`}><XIcon/> Disapprove</button>
              </>
            )}
          </>
        )}

        {role === UserRole.IDS && item.status === PrescriptionStatus.FOR_IDS_APPROVAL && (
           <>
             <button onClick={() => onAction(item.id, ActionType.APPROVE)} className={`flex-1 ${btnBase} bg-green-600 text-white hover:bg-green-700`}><CheckIcon/> Approve</button>
             <button onClick={() => onAction(item.id, ActionType.DISAPPROVE)} className={`flex-1 ${btnBase} bg-white text-red-600 border border-red-200 hover:bg-red-50`}><XIcon/> Disapprove</button>
           </>
        )}

        {role === UserRole.RESIDENT && item.status === PrescriptionStatus.DISAPPROVED && (
            <>
                <button onClick={() => onAction(item.id, ActionType.RESEND, { isEditing: true })} className={`flex-1 ${btnBase} bg-blue-600 text-white hover:bg-blue-700`}>
                    <EditIcon/> Edit
                </button>
                <button onClick={() => onAction(item.id, ActionType.RESEND)} className={`flex-1 ${btnBase} bg-green-600 text-white hover:bg-green-700`}>
                    <RefreshIcon/> Resend
                </button>
                <button onClick={() => onAction(item.id, ActionType.DELETE)} className={`${btnBase} bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700 w-10 h-10 p-0`} title="Delete Request"><TrashIcon/></button>
            </>
        )}
      </div>
    </div>
  );
};

export default PrescriptionCard;