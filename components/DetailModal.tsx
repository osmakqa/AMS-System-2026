import React, { useState, useEffect } from 'react';
import { Prescription, UserRole, PrescriptionStatus, DrugType, ActionType, RequestFinding, PreviousAntibiotic, Organism } from '../types';
import { IDS_SPECIALISTS, DETAILED_SYSTEM_SITE_OPTIONS } from '../constants'; 
import { PEDIATRIC_MONOGRAPHS } from '../data/pediatricMonographs';
import { verifyPediatricDosing } from '../services/geminiService';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Prescription | null;
  role?: string;
  userName?: string;
  onAction?: (id: string, action: ActionType, payload?: any) => void;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return '';
  }
};

const LifecycleTracker: React.FC<{ item: Prescription }> = ({ item }) => {
  const finalDecisionTime = item.ids_approved_at || item.ids_disapproved_at || item.dispensed_date;

  const stages = [
    {
      name: 'Request Created',
      isComplete: true,
      isInProgress: false,
      info: `By ${item.resident_name || item.requested_by} on ${formatDateTime(item.created_at || item.req_date)}`
    },
    {
      name: 'Pharmacist Action',
      isComplete: item.status !== PrescriptionStatus.PENDING,
      isInProgress: item.status === PrescriptionStatus.PENDING,
      info: item.dispensed_date 
        ? `By ${item.dispensed_by || 'Pharmacist'} on ${formatDateTime(item.dispensed_date)}` 
        : (item.status === PrescriptionStatus.FOR_IDS_APPROVAL ? 'Forwarded to IDS' : 'Awaiting review...')
    },
    ...(item.drug_type === DrugType.RESTRICTED ? [{
      name: 'IDS Review',
      isComplete: !!item.ids_approved_at || !!item.ids_disapproved_at,
      isInProgress: item.status === PrescriptionStatus.FOR_IDS_APPROVAL,
      info: item.ids_approved_at 
        ? `Approved by ${item.id_specialist || 'IDS'} on ${formatDateTime(item.ids_approved_at)}` 
        : (item.ids_disapproved_at 
            ? `Disapproved by ${item.id_specialist || 'IDS'} on ${formatDateTime(item.ids_disapproved_at)}`
            : 'Awaiting Specialist...')
    }] : []),
    {
      name: 'Finalized',
      isComplete: item.status === PrescriptionStatus.APPROVED || item.status === PrescriptionStatus.DISAPPROVED,
      isInProgress: false,
      info: item.status === PrescriptionStatus.APPROVED 
        ? `Approved on ${formatDateTime(finalDecisionTime)}` 
        : (item.status === PrescriptionStatus.DISAPPROVED 
            ? `Disapproved on ${formatDateTime(finalDecisionTime)}` 
            : 'In Progress')
    }
  ];

  const Icon = ({ isComplete, isInProgress }: { isComplete: boolean, isInProgress: boolean }) => {
    if (isComplete) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
      );
    }
    if (isInProgress) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center relative">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
           <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-300"></div>
    );
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
      <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Request Lifecycle</h4>
      <div className="flex justify-between items-start overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.name}>
            <div className="flex flex-col items-center text-center min-w-[120px] max-w-[160px]">
              <Icon isComplete={stage.isComplete} isInProgress={stage.isInProgress} />
              <p className={`text-xs font-bold mt-2 ${stage.isComplete ? 'text-green-700' : 'text-gray-600'}`}>{stage.name}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-1 px-1">{stage.info}</p>
            </div>
            {index < stages.length - 1 && (
              <div className="flex-1 h-px bg-gray-300 mt-4 mx-2 min-w-[20px]"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const FINDING_CATEGORIES = [
  'Wrong Choice',
  'Wrong Route',
  'Wrong Dose',
  'Wrong Duration',
  'No Infection',
  'Wrong Frequency',
  'Duplicate ARF',
  'Outdated Creatinine Used',
  'Wrong Indication Type',
  'Wrong Age',
  'Wrong or No Unit Dose',
  'Wrong Patient Information',
  'No Pharmacy Requisition Slip',
  'Others'
];

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, item, role, userName, onAction }) => {
  const [dosingCheck, setDosingCheck] = useState<{ isSafe: boolean; message: string } | null>(null);
  const [isCheckingDose, setIsCheckingDose] = useState(false);
  
  const [findings, setFindings] = useState<RequestFinding[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [currentDetails, setCurrentDetails] = useState<string>('');
  
  // Mobile UI state
  const [mobileTab, setMobileTab] = useState<'details' | 'review'>('details');

  const isReviewer = role === UserRole.PHARMACIST || role === UserRole.AMS_ADMIN || role === UserRole.IDS;
  const isNurse = role === UserRole.NURSE;
  const findingsToDisplay = isReviewer ? findings : (item?.findings || []);

  useEffect(() => {
    let active = true;
    const checkDose = async () => {
      const shouldCheck = role === UserRole.PHARMACIST || role === UserRole.AMS_ADMIN || role === UserRole.IDS || role === UserRole.NURSE;
      
      if (item && item.mode === 'pediatric' && shouldCheck) {
        setIsCheckingDose(true);
        const monograph = PEDIATRIC_MONOGRAPHS[item.antimicrobial];
        if (monograph) {
          const result = await verifyPediatricDosing(
            item.antimicrobial, 
            item.weight_kg || '', 
            item.age || '', 
            item.dose || '', 
            item.frequency || '', 
            monograph.dosing
          );
          if (active && result) setDosingCheck(result);
        }
        if (active) setIsCheckingDose(false);
      } else {
        setDosingCheck(null);
      }
    };
    if (isOpen && item) {
      setDosingCheck(null);
      checkDose();
      if (isReviewer) { 
        setFindings(item.findings || []);
      }
      setActiveSection(null);
      setCurrentCategory('');
      setCurrentDetails('');
      setMobileTab('details');
    }
    return () => { active = false; };
  }, [isOpen, item, role, isReviewer]);

  if (!isOpen || !item) return null;

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const formatStatus = (status: string) => {
     if (!status) return 'N/A';
     if (status === 'for_ids_approval') return 'For IDS Approval';
     return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleAction = (action: ActionType) => { 
    if (onAction) {
      if (action === ActionType.DISAPPROVE) {
        if (isReviewer) {
            if (findings.length === 0) {
              alert("Please add at least one finding before disapproving.");
              return;
            }
            onAction(item.id, action, { findings }); 
        } else {
            onAction(item.id, action);
        }
      } else if (action === ActionType.APPROVE) {
        if (isReviewer && findings.length > 0) {
             onAction(item.id, action, { findings });
        } else {
             onAction(item.id, action);
        }
      } else if (action === ActionType.SAVE_FINDINGS) {
        onAction(item.id, action, { findings });
      } else if (action === ActionType.ADMIN_EDIT) {
        onAction(item.id, action);
      } else {
        onAction(item.id, action); 
      }
      onClose(); 
    } 
  };

  const handleAddFinding = () => {
    if (!activeSection || !currentCategory) return;
    const newFinding: RequestFinding = {
      id: Date.now().toString(),
      section: activeSection,
      category: currentCategory as any,
      details: currentDetails,
      timestamp: new Date().toISOString(),
      user: userName || (role === UserRole.PHARMACIST ? `Pharmacist` : `Admin`)
    };
    setFindings([...findings, newFinding]);
    setCurrentCategory('');
    setCurrentDetails('');
    setActiveSection(null);
  };

  const removeFinding = (id: string) => {
    setFindings(findings.filter(f => f.id !== id));
  };

  const SectionTitle = ({ title }: { title: string }) => <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider border-b border-green-100 pb-1 mb-3 mt-2 pointer-events-none">{title}</h3>;
  
  const InfoItem = ({ label, value, fullWidth = false }: { label: string, value?: any, fullWidth?: boolean }) => (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
      <p className="text-sm text-gray-900 font-medium break-words whitespace-pre-wrap">{value || '-'}</p>
    </div>
  );

  const SelectableSection = ({ id, title, children, className = '' }: { id: string, title: string, children?: React.ReactNode, className?: string }) => {
    const isSelected = isReviewer && activeSection === id; 
    const hasFinding = isReviewer && findings.some(f => f.section === id); 
    return (
      <div 
        onClick={() => {
            if (isReviewer) {
                setActiveSection(id);
                // Switch to review tab on mobile automatically
                if (window.innerWidth < 1024) {
                    setMobileTab('review');
                }
            }
        }}
        className={`relative transition-all duration-200 ${className} ${isReviewer ? 'cursor-pointer hover:ring-2 hover:ring-green-400 hover:shadow-md' : ''} ${isSelected ? 'ring-2 ring-yellow-400 shadow-sm' : ''} ${hasFinding ? 'border-l-4 border-l-red-400' : ''}`}
      >
        {isReviewer && (
          <div className="absolute top-2 right-2 opacity-0 lg:group-hover:opacity-100 transition-opacity bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold pointer-events-none">
            Click to Review
          </div>
        )}
        <SectionTitle title={title} />
        {children}
      </div>
    );
  };

  const renderPrevAbx = (data: any) => {
    const items = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(items) || items.length === 0) return <p className="text-sm text-gray-400 italic">None reported</p>;
    
    return (
        <div className="space-y-3">
            {items.map((abx: PreviousAntibiotic, idx: number) => (
                <div key={idx} className="bg-orange-50/50 border border-orange-100 p-2 rounded-lg">
                    <p className="text-sm font-bold text-orange-900">{abx.drug}</p>
                    <div className="flex gap-4 mt-1">
                        <div className="text-[10px] uppercase font-bold text-orange-700/60">Freq: <span className="text-orange-900">{abx.frequency}</span></div>
                        <div className="text-[10px] uppercase font-bold text-orange-700/60">Dur: <span className="text-orange-900">{abx.duration}</span></div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const renderOrganisms = (data: any) => {
    const items = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(items) || items.length === 0) return <p className="text-sm text-gray-400 italic">No organisms recorded</p>;

    return (
        <div className="space-y-4">
            {items.map((org: Organism, idx: number) => (
                <div key={idx} className="bg-red-50/50 border border-red-100 p-3 rounded-lg">
                    <p className="text-sm font-bold text-red-900 uppercase tracking-tight mb-2 flex items-center gap-2">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.535 5.357a1 1 0 011.414-1.414 3.999 3.999 0 005.657 0 1 1 0 011.414 1.414 5.999 5.999 0 01-8.485 0z" clipRule="evenodd"/></svg>
                        {org.name}
                    </p>
                    <div className="space-y-1 pl-5 border-l-2 border-red-100">
                        {org.susceptibilities?.map((s, sIdx) => (
                            <div key={sIdx} className="text-xs flex justify-between">
                                <span className="text-gray-600">{s.drug}</span>
                                <span className={`font-black ${s.result === 'S' ? 'text-green-600' : s.result === 'R' ? 'text-red-600' : 'text-orange-600'}`}>
                                    {s.result}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const getFullSystemSite = () => {
      if (!item.system_site) return '-';
      if (item.system_site === 'OTHERS (SPECIFY)') return item.system_site_other || 'Others';
      const found = DETAILED_SYSTEM_SITE_OPTIONS.find(opt => opt.code === item.system_site);
      return found ? `${item.system_site} - ${found.description}` : item.system_site;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-0 md:p-4 animate-fade-in backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-[90vh] flex flex-col border border-gray-200 overflow-hidden ${isReviewer ? 'max-w-full md:max-w-[95vw]' : 'max-w-full md:max-w-4xl'}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-green-700 text-white px-4 md:px-6 py-4 flex justify-between items-start shrink-0">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h2 className="text-lg md:text-2xl font-bold truncate">{item.patient_name}</h2>
                <div className="flex gap-1.5 shrink-0">
                  {item.arf_number ? (
                    <span className="px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-black bg-blue-600 border border-white/30 backdrop-blur-md uppercase tracking-widest">ARF-{String(item.arf_number).padStart(4, '0')}</span>
                  ) : (
                    <span className="px-2 md:px-3 py-0.5 rounded-full text-[9px] md:text-[10px] font-black bg-white/20 border border-white/30 backdrop-blur-md uppercase tracking-widest">#{item.request_number || 'N/A'}</span>
                  )}
                  <span className="px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-white/20 border border-white/30 backdrop-blur-md">{formatStatus(item.status)}</span>
                </div>
            </div>
            <div className="flex gap-4 mt-1 md:mt-2 text-[11px] md:text-sm opacity-90">
                <p>Hosp ID: <span className="font-mono font-bold bg-green-800 px-1.5 md:px-2 py-0.5 rounded">{item.hospital_number}</span></p>
                <p className="hidden sm:block">Date: <span className="font-bold">{item.req_date ? new Date(item.req_date).toLocaleDateString() : 'N/A'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-green-600 rounded-full p-2 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
            
            {/* Mobile Tab Switcher - Only visible on small screens for reviewers */}
            {isReviewer && (
                <div className="lg:hidden flex border-b border-gray-200 bg-white sticky top-0 z-20">
                    <button 
                        onClick={() => setMobileTab('details')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${mobileTab === 'details' ? 'border-green-600 text-green-700 bg-green-50/30' : 'border-transparent text-gray-400'}`}
                    >
                        Patient Records
                    </button>
                    <button 
                        onClick={() => setMobileTab('review')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative ${mobileTab === 'review' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-400'}`}
                    >
                        Review Workspace
                        {findings.length > 0 && <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white">{findings.length}</span>}
                    </button>
                </div>
            )}

            {/* Left Pane: Request Details */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 ${isReviewer && mobileTab !== 'details' ? 'hidden lg:block' : 'block'}`}>
                <LifecycleTracker item={item} />
                
                {(isCheckingDose || dosingCheck) && (
                    <div className={`p-4 rounded-lg border-l-4 shadow-sm mb-6 ${dosingCheck?.isSafe ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                        {isCheckingDose ? (
                        <p className="text-sm text-gray-500 italic animate-pulse">Verifying pediatric dosage with AI...</p>
                        ) : (
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${dosingCheck?.isSafe ? 'text-green-600' : 'text-yellow-600'}`}>
                                {dosingCheck?.isSafe ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> 
                                : 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1-1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                }
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold uppercase ${dosingCheck?.isSafe ? 'text-green-800' : 'text-yellow-800'}`}>
                                {dosingCheck?.isSafe ? 'Dosing Verified' : 'Dosing Alert'}
                                </h4>
                                <p className="text-sm text-gray-700 mt-1">{dosingCheck?.message}</p>
                            </div>
                        </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <SelectableSection id="Patient Profile" title="Patient Profile" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                            <InfoItem label="DOB" value={item.patient_dob ? new Date(item.patient_dob).toLocaleDateString() : '-'} />
                            <InfoItem label="Age" value={item.age} />
                            <InfoItem label="Sex" value={item.sex} />
                            <InfoItem label="Weight" value={`${item.weight_kg} kg`} />
                            <InfoItem label="Height" value={item.height_cm ? `${item.height_cm} cm` : '-'} />
                            <InfoItem label="Ward" value={item.ward} fullWidth />
                        </div>
                    </SelectableSection>
                    
                    <SelectableSection id="Clinical Data" title="Clinical Data" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                            <InfoItem label="Diagnosis" value={item.diagnosis} fullWidth />
                            <InfoItem label="System / Site" value={getFullSystemSite()} fullWidth />
                            <InfoItem label="SGPT" value={item.sgpt} />
                            <InfoItem label="SCr" value={item.scr_mgdl} />
                            {item.scr_date && <InfoItem label="SCr Date" value={new Date(item.scr_date).toLocaleDateString()} fullWidth />}
                            <div className="col-span-full">
                                <p className="text-xs text-gray-500 uppercase font-semibold">eGFR</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-900 font-medium">{item.egfr_text || '-'}</p>
                                    {item.is_esrd && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase border border-red-200">On Dialysis</span>}
                                </div>
                            </div>
                        </div>
                    </SelectableSection>
                    
                    <SelectableSection id="Medication Request" title="Medication Request" className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                        <div className="space-y-3">
                            <InfoItem label="Antimicrobial" value={item.antimicrobial} fullWidth />
                            <div className="grid grid-cols-2 gap-2">
                                <InfoItem label="Type" value={item.drug_type} />
                                <InfoItem label="Dose" value={item.dose} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <InfoItem label="Frequency" value={item.frequency} />
                                <InfoItem label="Route" value={item.route} />
                            </div>
                            <div className="grid grid-cols-1">
                                <InfoItem label="Duration" value={item.duration} />
                            </div>
                        </div>
                    </SelectableSection>
                    
                    <SelectableSection id="Indication" title="Indication" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="space-y-4">
                            <InfoItem label="Indication Type" value={item.indication} fullWidth />
                            <InfoItem label="Clinical Justification" value={item.basis_indication} fullWidth />
                        </div>
                    </SelectableSection>
                    
                    <SelectableSection id="Microbiology & History" title="Microbiology & History" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Previous Antibiotics (30d)</p>
                                {renderPrevAbx(item.previous_antibiotics)}
                            </div>
                            <div className="mt-4 md:mt-0">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Culture & Sensitivity</p>
                                <InfoItem label="Specimen" value={item.specimen} />
                                <div className="mt-4">
                                    {renderOrganisms(item.organisms)}
                                </div>
                            </div>
                        </div>
                    </SelectableSection>
                    
                    <SelectableSection id="Personnel Involved" title="Accountability" className="bg-gray-50 p-4 rounded-lg border border-gray-100 col-span-full">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <InfoItem label="Resident" value={item.resident_name} />
                            <InfoItem label="IDS Rotator" value={item.service_resident_name} />
                            <InfoItem label="Dept" value={item.clinical_dept} />
                            <InfoItem label="IDS Consultant" value={item.id_specialist} />
                            <InfoItem label="Pharmacist" value={item.dispensed_by} />
                        </div>
                    {/* Fixed typo in closing tag from SectionWrapper to SelectableSection */}
                    </SelectableSection>
                </div>

                {/* Findings Section - Show if findings exist */}
                {(findingsToDisplay.length > 0) && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                      Reviewer Findings & Interventions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {findingsToDisplay.map((f, idx) => (
                        <div key={idx} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded">{f.section}</span>
                            <span className="text-[9px] text-indigo-400 font-bold uppercase">{new Date(f.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-black text-indigo-900 mb-1">{f.category}</p>
                          <p className="text-xs text-indigo-800 leading-relaxed italic">{f.details}</p>
                          <div className="mt-3 text-[10px] text-indigo-400 font-bold uppercase text-right border-t border-indigo-100 pt-2">
                            Logged by: {f.user}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Right Pane: Findings (Reviewer Workspace) */}
            {isReviewer && (
                <div className={`w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 shadow-lg flex flex-col z-10 transition-all ${mobileTab !== 'review' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center shrink-0">
                        <h4 className="font-bold text-yellow-800 flex items-center gap-2">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                            Reviewer Workspace
                        </h4>
                        {findings.length > 0 && <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-[10px] font-black uppercase">{findings.length} findings</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeSection ? (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-xs font-bold text-blue-800 uppercase">Adding Finding For:</h5>
                                    <button onClick={() => setActiveSection(null)} className="text-blue-400 hover:text-blue-600 text-lg leading-none">&times;</button>
                                </div>
                                <p className="text-sm font-bold text-gray-800 mb-3 border-b border-blue-200 pb-2">{activeSection}</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Finding Category</label>
                                        <select 
                                            className="w-full text-sm border-gray-300 rounded-md bg-white text-gray-900 h-10 px-2"
                                            value={currentCategory}
                                            onChange={(e) => setCurrentCategory(e.target.value)}
                                        >
                                            <option value="">Select Category...</option>
                                            {FINDING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Specific Remarks</label>
                                        <textarea 
                                            className="w-full text-sm border-gray-300 rounded-md bg-white text-gray-900 p-3"
                                            rows={4}
                                            placeholder="Document clinical concerns or intervention details here..."
                                            value={currentDetails}
                                            onChange={(e) => setCurrentDetails(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAddFinding}
                                        disabled={!currentCategory}
                                        className="w-full bg-blue-600 text-white px-3 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 shadow-sm"
                                    >
                                        Add to Interventions
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 px-4 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                <p className="text-sm font-medium">Select any patient record section on the left to document clinical interventions.</p>
                            </div>
                        )}

                        {findings.length > 0 && (
                            <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Findings Log</h5>
                                {findings.map((f, idx) => (
                                    <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-lg shadow-sm relative group">
                                        {role !== UserRole.PHARMACIST && (
                                            <button 
                                                onClick={() => removeFinding(f.id)}
                                                className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-60 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-xl leading-none"
                                            >
                                                &times;
                                            </button>
                                        )}
                                        <p className="text-[10px] font-black text-red-800 uppercase mb-1 tracking-tight">{f.section}</p>
                                        <p className="text-sm font-bold text-gray-900">{f.category}</p>
                                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{f.details}</p>
                                        <div className="mt-2 text-right">
                                            <span className="text-[9px] text-red-700 font-bold uppercase">By: {f.user} • {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
             <div className="text-[10px] font-mono text-gray-400 hidden sm:block">ID: {item.id}</div>
             <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
                 {role === UserRole.PHARMACIST && item.status === PrescriptionStatus.PENDING && (
                    <>
                        {item.drug_type === DrugType.RESTRICTED ? (
                            <>
                                <button onClick={() => handleAction(ActionType.FORWARD_IDS)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">For IDS Approval</button>
                                <button onClick={() => handleAction(ActionType.DISAPPROVE)} className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Disapprove</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleAction(ActionType.APPROVE)} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Approve</button>
                                <button onClick={() => handleAction(ActionType.DISAPPROVE)} className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Disapprove</button>
                            </>
                        )}
                    </>
                 )}
                 {role === UserRole.IDS && (item.status === PrescriptionStatus.FOR_IDS_APPROVAL) && (
                    <>
                        <button onClick={() => handleAction(ActionType.APPROVE)} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Approve</button>
                        <button onClick={() => handleAction(ActionType.DISAPPROVE)} className="flex-1 md:flex-none bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Disapprove</button>
                    </>
                 )}
                 {isReviewer && (
                    <button onClick={() => handleAction(ActionType.SAVE_FINDINGS)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Update Findings</button>
                 )}
                 {role === UserRole.AMS_ADMIN && (
                    <button onClick={() => handleAction(ActionType.ADMIN_EDIT)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs md:text-sm">Edit Clinical Details</button>
                 )}
                 <button onClick={onClose} className="flex-1 md:flex-none px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-bold transition-colors border border-gray-300 shadow-sm text-xs md:text-sm">Close</button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;