import React, { useState, useMemo, useEffect } from 'react';
import { MonitoringPatient, MonitoringAntimicrobial, AdminLogEntry, User, Prescription } from '../types';
import { updateMonitoringPatient, fetchPrescriptions } from '../services/dataService';

interface MonitoringDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: MonitoringPatient | null;
  user: User | null;
  onUpdate: () => void;
}

const normalizeLogEntry = (entry: string | AdminLogEntry | null | undefined): AdminLogEntry | null => {
    if (!entry) return null;
    if (typeof entry === 'string') return { time: entry, status: 'Given' };
    return entry;
};

const STOP_REASONS = ["De-escalation", "Adverse Event / Toxicity", "No Infection", "Clinical Failure", "Resistant Organism", "Palliative / Comfort Care", "Patient Discharged / Expired", "Others (Specify)"];
const SHIFT_REASONS = ["IV to PO Switch", "Escalation (Broadening)", "De-escalation (Narrowing)", "Renal Adjustment", "Adverse Event", "Others (Specify)"];
const DOSE_CHANGE_REASONS = ["Renal Adjustment", "Hepatic Adjustment", "Clinical Improvement", "Clinical Worsening", "Adverse Event", "Others (Specify)"];

const MonitoringDetailModal: React.FC<MonitoringDetailModalProps> = ({ isOpen, onClose, patient, user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [activeDrugAction, setActiveDrugAction] = useState<{ drugId: string, type: 'Stop' | 'Shift' | 'Dose' } | null>(null);
  const [cellAction, setCellAction] = useState<{ drugId: string, day: number, doseIndex: number } | null>(null);
  const [pendingUndo, setPendingUndo] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'Flowsheet' | 'Summary' | 'Profile'>('Flowsheet');
  
  // States for adding new medication from requests
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [availableRequests, setAvailableRequests] = useState<Prescription[]>([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);

  const [actionForm, setActionForm] = useState({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0],
      status: 'Given' as 'Given' | 'Missed',
      reason: '',
      newDose: '',
      remarks: ''
  });

  // Handle setting initial view mode based on screen size
  useEffect(() => {
      if (isOpen) {
          if (window.innerWidth < 1024) {
              setViewMode('Profile');
          } else {
              setViewMode('Flowsheet');
          }
      }
  }, [isOpen]);

  const dayColumns = useMemo(() => {
    if (!patient || !patient.antimicrobials || patient.antimicrobials.length === 0) {
      return Array.from({ length: 7 }, (_, i) => i + 1);
    }
    const maxDuration = Math.max(...patient.antimicrobials.map(a => {
        const d = parseInt(a.planned_duration);
        return isNaN(d) ? 7 : d;
    }));
    return Array.from({ length: Math.max(7, maxDuration) }, (_, i) => i + 1);
  }, [patient]);

  useEffect(() => {
    if (isAddingMed && patient) {
        const loadRequests = async () => {
            setFetchingRequests(true);
            try {
                const { data } = await fetchPrescriptions();
                const patientRequests = data.filter(r => 
                    r.hospital_number === patient.hospital_number || 
                    r.patient_name.toLowerCase().includes(patient.patient_name.toLowerCase())
                );
                const existingDrugNames = (patient.antimicrobials || []).map(a => a.drug_name.toLowerCase());
                const filtered = patientRequests.filter(r => !existingDrugNames.includes(r.antimicrobial.toLowerCase()));
                setAvailableRequests(filtered);
            } catch (err) {
                console.error("Failed to load requests", err);
            } finally {
                setFetchingRequests(false);
            }
        };
        loadRequests();
    }
  }, [isAddingMed, patient]);

  if (!isOpen || !patient) return null;

  const handleAddMedFromRequest = async (req: Prescription) => {
    setLoading(true);
    try {
        const newAbx: MonitoringAntimicrobial = {
            id: Math.random().toString(36).substr(2, 9),
            drug_name: req.antimicrobial,
            dose: req.dose || '',
            route: 'IV',
            frequency: req.frequency || '',
            frequency_hours: parseInt(req.frequency?.replace('q', '').replace('h', '') || '8'),
            start_date: req.req_date ? req.req_date.split('T')[0] : new Date().toISOString().split('T')[0],
            planned_duration: req.duration || '7',
            requesting_resident: req.resident_name || '',
            ids_in_charge: req.id_specialist || '',
            status: 'Active',
            administration_log: {}
        };

        const updatedAbx = [...(patient.antimicrobials || []), newAbx];
        await updateMonitoringPatient(patient.id, { 
            antimicrobials: updatedAbx, 
            last_updated_by: user?.name 
        });
        setIsAddingMed(false);
        onUpdate();
        // Switch to flowsheet on mobile to see the new entry
        if (window.innerWidth < 1024) setViewMode('Flowsheet');
    } catch (err: any) {
        alert("Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleUndoStatus = async (drugId: string) => {
    setLoading(true);
    try {
        const updatedAbx = (patient.antimicrobials || []).map(d => 
            (d && d.id === drugId) ? { 
                ...d, 
                status: 'Active' as const, 
                stop_date: undefined, 
                completed_at: undefined, 
                shifted_at: undefined,
                stop_reason: undefined,
                shift_reason: undefined,
                action_by: undefined
            } : d
        );
        await updateMonitoringPatient(patient.id, { antimicrobials: updatedAbx, last_updated_by: user?.name });
        setPendingUndo(null);
        onUpdate();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleTimeUpdate = async (drugId: string, timeIndex: number, newTime: string) => {
    const updatedAbx = (patient.antimicrobials || []).map(d => {
        if (!d || d.id !== drugId) return d;
        const currentTimes = (d as any).scheduled_times || [];
        const newTimes = [...currentTimes];
        const dosesPerDay = d.frequency_hours ? Math.max(1, Math.floor(24 / d.frequency_hours)) : 1;
        while (newTimes.length < dosesPerDay) newTimes.push("");
        newTimes[timeIndex] = newTime;
        return { ...d, scheduled_times: newTimes };
    });
    try {
        await updateMonitoringPatient(patient.id, { antimicrobials: updatedAbx, last_updated_by: user?.name });
        onUpdate();
    } catch (err: any) { console.error(err); }
  };

  const updateCellStatus = async (status: 'Given' | 'Missed' | null) => {
    if (!cellAction || !patient) return;
    const { drugId, day, doseIndex } = cellAction;

    const drug = patient.antimicrobials.find(d => d && d.id === drugId);
    if (!drug) return;

    const startDate = new Date(drug.start_date);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (day - 1));
    const dateStr = targetDate.toISOString().split('T')[0];

    const updatedAbx = patient.antimicrobials.map(d => {
        if (!d || d.id !== drugId) return d;
        const log = { ...(d.administration_log || {}) };
        const dayLog = [...(log[dateStr] || [])];
        const dosesPerDay = d.frequency_hours ? Math.max(1, Math.floor(24 / d.frequency_hours)) : 1;
        
        while (dayLog.length < dosesPerDay) dayLog.push(null as any);

        if (status) {
            dayLog[doseIndex] = { 
                status, 
                time: ((d as any).scheduled_times?.[doseIndex]) || "",
                user: user?.name,
                timestamp: new Date().toISOString()
            };
        } else {
            dayLog[doseIndex] = null as any; 
        }

        return { ...d, administration_log: { ...log, [dateStr]: dayLog } };
    });

    try {
        await updateMonitoringPatient(patient.id, { antimicrobials: updatedAbx, last_updated_by: user?.name });
        setCellAction(null);
        onUpdate();
    } catch (err: any) { console.error(err); }
  };

  const handleDrugAction = async () => {
      if (!activeDrugAction || !patient) return;
      setLoading(true);
      try {
          const updatedAbx = patient.antimicrobials.map(d => {
              if (!d || d.id !== activeDrugAction.drugId) return d;
              const now = new Date().toISOString();
              
              if (activeDrugAction.type === 'Stop') return { ...d, status: 'Stopped' as const, stop_date: now, stop_reason: actionForm.reason || actionForm.remarks, action_by: user?.name };
              if (activeDrugAction.type === 'Shift') return { ...d, status: 'Shifted' as const, shifted_at: now, shift_reason: actionForm.reason || actionForm.remarks, action_by: user?.name };
              if (activeDrugAction.type === 'Dose') {
                  const history = d.change_history || [];
                  return { 
                      ...d, 
                      dose: actionForm.newDose, 
                      change_history: [...history, { 
                          date: now, 
                          type: 'Dose Change' as const, 
                          oldValue: d.dose, 
                          newValue: actionForm.newDose, 
                          reason: actionForm.reason || actionForm.remarks, 
                          user: user?.name 
                      }] 
                  };
              }
              return d;
          });

          await updateMonitoringPatient(patient.id, { antimicrobials: updatedAbx, last_updated_by: user?.name });
          setActiveDrugAction(null);
          setActionForm({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), date: new Date().toISOString().split('T')[0], status: 'Given', reason: '', newDose: '', remarks: '' });
          onUpdate();
      } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleComplete = async (drugId: string) => {
    const confirmed = window.confirm("Mark this therapy as completed?");
    if (!confirmed) return;

    setLoading(true);
    try {
        const updatedAbx = patient.antimicrobials.map(d => (d && d.id === drugId) ? { ...d, status: 'Completed' as const, completed_at: new Date().toISOString(), action_by: user?.name } : d);
        await updateMonitoringPatient(patient.id, { antimicrobials: updatedAbx, last_updated_by: user?.name });
        onUpdate();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const calculateSummary = (drug: MonitoringAntimicrobial) => {
      const log = drug.administration_log || {};
      let given = 0;
      let missed = 0;
      Object.values(log).forEach((dayDoses: any[]) => {
          dayDoses.forEach(entry => {
              const e = normalizeLogEntry(entry);
              if (e?.status === 'Given') given++;
              else if (e?.status === 'Missed') missed++;
          });
      });
      const plannedDays = parseInt(drug.planned_duration) || 7;
      const dosesPerDay = drug.frequency_hours ? Math.max(1, Math.floor(24 / drug.frequency_hours)) : 1;
      const totalPlannedDoses = plannedDays * dosesPerDay;
      return { given, missed, totalPlannedDoses };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-0 md:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-none md:rounded-3xl shadow-2xl w-full max-w-[100vw] lg:max-w-[98vw] h-full md:h-[95vh] flex flex-col overflow-hidden border border-gray-100 relative" onClick={(e) => e.stopPropagation()}>
        
        <header className="bg-blue-600 text-white p-3 md:p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <div className="bg-white/20 p-1.5 md:p-2 rounded-xl backdrop-blur-md hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm md:text-xl font-black uppercase tracking-tight truncate">{patient.patient_name}</h3>
              <p className="text-[8px] md:text-[10px] text-white/70 font-bold uppercase tracking-widest truncate">{patient.hospital_number} • {patient.ward}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-white/10 p-0.5 md:p-1 rounded-lg md:rounded-xl flex">
                  <button onClick={() => setViewMode('Profile')} className={`lg:hidden px-2 md:px-4 py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}>Profile</button>
                  <button onClick={() => setViewMode('Flowsheet')} className={`px-2 md:px-4 py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Flowsheet' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}>Flowsheet</button>
                  <button onClick={() => setViewMode('Summary')} className={`px-2 md:px-4 py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}>Summary</button>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 md:p-2 hover:bg-white/10 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
            
            {/* SIDEBAR: Profile & Therapy Status - Responsive */}
            <div className={`w-full lg:w-[300px] border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto p-4 space-y-6 bg-gray-50/30 ${viewMode !== 'Profile' ? 'hidden lg:block' : 'block'}`}>
                <section className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-50 pb-1">Clinical Profile</h4>
                    <div className="space-y-3 text-black">
                        <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-3">
                            <div><p className="text-[9px] font-bold text-gray-400 uppercase">Age / Sex</p><p className="text-sm font-bold">{patient.age} / {patient.sex}</p></div>
                            <div><p className="text-[9px] font-bold text-gray-400 uppercase">Latest SCr</p><p className="text-sm font-bold">{patient.latest_creatinine || 'N/A'}</p></div>
                        </div>
                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">eGFR</p><p className="text-sm font-bold text-blue-700">{patient.egfr}</p></div>
                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">Primary Diagnosis</p><p className="text-sm font-bold leading-tight">{patient.infectious_diagnosis}</p></div>
                    </div>
                </section>

                <div className="flex justify-between items-center px-2 mb-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Therapy Status</h4>
                    <button 
                        onClick={() => setIsAddingMed(true)}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition-all"
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Drug
                    </button>
                </div>

                <div className="space-y-3">
                    {(patient.antimicrobials || []).map(drug => drug && (
                        <div key={drug.id} className={`p-4 rounded-xl border transition-all ${drug.status === 'Active' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h5 className="font-black text-black tracking-tight text-sm">{drug.drug_name}</h5>
                                    <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">{drug.dose} • {drug.route} • {drug.frequency}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Duration: {drug.planned_duration} days</p>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${drug.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>{drug.status}</span>
                            </div>
                            
                            <div className="flex flex-col gap-2 mt-3">
                                {drug.status === 'Active' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setActiveDrugAction({ drugId: drug.id, type: 'Dose' })} className="px-2 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Adj Dose</button>
                                            <button onClick={() => handleComplete(drug.id)} className="px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-all">Complete</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setActiveDrugAction({ drugId: drug.id, type: 'Shift' })} className="px-2 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all">Shift</button>
                                            <button onClick={() => setActiveDrugAction({ drugId: drug.id, type: 'Stop' })} className="px-2 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Stop</button>
                                        </div>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setPendingUndo(drug.id)} 
                                        className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all flex items-center justify-center gap-1"
                                    >
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                        Undo {drug.status}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className={`flex-1 overflow-auto p-2 md:p-4 bg-white relative ${viewMode === 'Profile' ? 'hidden lg:block' : 'block'}`}>
                {viewMode === 'Flowsheet' ? (
                    <div className="inline-block min-w-full border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="min-w-full border-collapse table-fixed">
                            <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200 text-black">
                                <tr>
                                    <th className="p-2 md:p-3 text-left text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-200 bg-gray-50 sticky left-0 z-30 w-32 md:w-60 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">Antimicrobial / Scheduled Times</th>
                                    {dayColumns.map(day => (
                                        <th key={day} className="p-2 md:p-3 text-center text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-200 min-w-[50px] md:min-w-[70px]">
                                            <div className="text-blue-600">Day {day}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(patient.antimicrobials || []).map(drug => {
                                    if (!drug) return null;
                                    const dosesPerDay = drug.frequency_hours ? Math.max(1, Math.floor(24 / drug.frequency_hours)) : 1;
                                    const scheduledTimes = (drug as any).scheduled_times || Array(dosesPerDay).fill("");
                                    const plannedDuration = parseInt(drug.planned_duration) || 7;
                                    
                                    return (
                                        <React.Fragment key={drug.id}>
                                            {/* Medication Header Row */}
                                            <tr className="bg-gray-50/50">
                                                <td className="p-2 md:p-3 border-r border-gray-200 sticky left-0 z-10 bg-gray-50 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                                                    <div className="font-black text-[10px] md:text-xs text-black uppercase tracking-tight truncate">{drug.drug_name}</div>
                                                    <div className="hidden md:block text-[9px] text-gray-500 font-bold uppercase">{drug.dose} • {drug.route} • {drug.frequency}</div>
                                                    <div className="text-[7px] md:text-[8px] text-blue-600 font-black uppercase mt-0.5">Target: {plannedDuration}d</div>
                                                </td>
                                                {dayColumns.map(day => {
                                                    const isBeyond = day > plannedDuration;
                                                    return <td key={day} className={`border-r border-gray-100 ${isBeyond ? 'bg-gray-200/40' : 'bg-gray-50/30'}`} />;
                                                })}
                                            </tr>
                                            {/* Dose rows with Time in First Column */}
                                            {Array.from({ length: dosesPerDay }).map((_, doseIdx) => (
                                                <tr key={`${drug.id}-${doseIdx}`} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-1 md:p-2 border-r border-gray-200 sticky left-0 z-10 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                                        <span className="text-[7px] md:text-[9px] font-black text-gray-400 shrink-0">Dose {doseIdx + 1}:</span>
                                                        <input 
                                                            type="time" 
                                                            className="flex-1 text-[9px] md:text-xs font-bold border border-gray-200 bg-gray-50 text-gray-800 p-0.5 md:p-1 px-1 md:px-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white [color-scheme:light]"
                                                            value={scheduledTimes[doseIdx] || ""}
                                                            onChange={(e) => handleTimeUpdate(drug.id, doseIdx, e.target.value)}
                                                        />
                                                    </td>
                                                    {dayColumns.map(day => {
                                                        const isBeyond = day > plannedDuration;
                                                        const startDate = new Date(drug.start_date);
                                                        const cellDate = new Date(startDate);
                                                        cellDate.setDate(startDate.getDate() + (day - 1));
                                                        const dateStr = cellDate.toISOString().split('T')[0];
                                                        const logEntry = normalizeLogEntry(drug.administration_log?.[dateStr]?.[doseIdx]);
                                                        const isActive = drug.status === 'Active' && !isBeyond;
                                                        
                                                        return (
                                                            <td 
                                                                key={day} 
                                                                className={`p-1 md:p-2 border-r border-gray-100 text-center transition-all ${isActive ? 'cursor-pointer hover:bg-blue-100' : (isBeyond ? 'bg-gray-200/50 cursor-not-allowed' : 'bg-gray-50 opacity-40')}`}
                                                                onClick={() => isActive && setCellAction({ drugId: drug.id, day, doseIndex: doseIdx })}
                                                            >
                                                                {logEntry ? (
                                                                    <div className={`w-6 h-6 md:w-8 md:h-8 mx-auto rounded-lg flex items-center justify-center text-[8px] md:text-[10px] font-black border shadow-sm ${logEntry.status === 'Given' ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'}`} title={logEntry.user ? `Logged by ${logEntry.user}` : ''}>
                                                                        {logEntry.status === 'Given' ? 'G' : 'M'}
                                                                    </div>
                                                                ) : (
                                                                    isBeyond ? (
                                                                        <div className="w-full h-full flex items-center justify-center text-[7px] md:text-[8px] font-black text-gray-400 opacity-30 select-none">
                                                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: 0.2 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-4 h-4 md:w-6 md:h-6 mx-auto border border-gray-200 rounded-md border-dashed bg-gray-50/50" />
                                                                    )
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-8 max-w-4xl mx-auto py-2 md:py-4">
                        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm">
                            <h4 className="text-sm md:text-xl font-black text-black uppercase tracking-tight mb-4 md:mb-6">Antimicrobial Administration Summary</h4>
                            <div className="space-y-4 md:space-y-6">
                                {(patient.antimicrobials || []).map(drug => {
                                    const { given, missed, totalPlannedDoses } = calculateSummary(drug);
                                    const progress = Math.min(100, Math.round((given / totalPlannedDoses) * 100));
                                    const missedPercent = Math.min(100, Math.round((missed / totalPlannedDoses) * 100));
                                    
                                    return (
                                        <div key={drug.id} className="p-3 md:p-5 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-4 gap-2 md:gap-4">
                                                <div>
                                                    <h5 className="text-sm md:text-lg font-black text-black leading-tight">{drug.drug_name}</h5>
                                                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Started: {drug.start_date}</p>
                                                </div>
                                                <div className="flex items-center gap-4 md:gap-6">
                                                    <div className="text-center">
                                                        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Given</p>
                                                        <p className="text-sm md:text-xl font-black text-green-600">{given}</p>
                                                    </div>
                                                    <div className="text-center border-l border-gray-200 pl-4 md:pl-6">
                                                        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Missed</p>
                                                        <p className="text-sm md:text-xl font-black text-red-600">{missed}</p>
                                                    </div>
                                                    <div className="text-center border-l border-gray-200 pl-4 md:pl-6">
                                                        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Planned</p>
                                                        <p className="text-sm md:text-xl font-black text-blue-600">{totalPlannedDoses}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-green-700">{progress}% Adherence</span>
                                                    <span className="text-gray-400">{given + missed} of {totalPlannedDoses} doses</span>
                                                </div>
                                                <div className="w-full h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
                                                    <div className="h-full bg-red-500" style={{ width: `${missedPercent}%` }} />
                                                </div>
                                            </div>
                                            
                                            {drug.status !== 'Active' && (
                                                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 flex justify-between items-center">
                                                    <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">Reason for {drug.status}:</div>
                                                    <p className="text-[10px] md:text-xs font-bold text-gray-700 italic">{drug.stop_reason || drug.shift_reason || 'Not documented'}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 md:mt-6 flex gap-3 md:gap-6 text-[7px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest flex-wrap">
                    <div className="flex items-center gap-1.5 md:gap-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-green-600 rounded border border-green-700" /> Given (G)</div>
                    <div className="flex items-center gap-1.5 md:gap-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-red-600 rounded border border-red-700" /> Missed (M)</div>
                    <div className="flex items-center gap-1.5 md:gap-2"><div className="w-3 h-3 md:w-4 md:h-4 border border-gray-200 border-dashed rounded bg-gray-50" /> Not Logged</div>
                    <div className="flex items-center gap-1.5 md:gap-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-gray-200 rounded border border-gray-300" /> End of Tx</div>
                </div>
            </div>
        </div>

        {/* Action Overlay Modals - Mobile Friendly */}
        {activeDrugAction && (
            <div className="absolute inset-0 bg-white/95 z-[200] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                <div className="w-full max-w-md space-y-4 md:space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-100">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg md:text-2xl font-black text-black uppercase tracking-tight">{activeDrugAction.type} Medication</h3>
                        <button onClick={() => setActiveDrugAction(null)} className="text-gray-400 hover:text-black"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {activeDrugAction.type === 'Stop' && (
                            <div className="flex flex-col gap-1 text-black">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Stopping</label>
                                <select className="p-2.5 md:p-3 bg-white border border-gray-300 rounded-xl text-black text-sm md:text-base font-bold outline-none [color-scheme:light]" value={actionForm.reason} onChange={e => setActionForm({...actionForm, reason: e.target.value})}>
                                    <option value="">Select Reason</option>
                                    {STOP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        )}

                        {activeDrugAction.type === 'Shift' && (
                            <div className="flex flex-col gap-1 text-black">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Shifting</label>
                                <select className="p-2.5 md:p-3 bg-white border border-gray-300 rounded-xl text-black text-sm md:text-base font-bold outline-none [color-scheme:light]" value={actionForm.reason} onChange={e => setActionForm({...actionForm, reason: e.target.value})}>
                                    <option value="">Select Reason</option>
                                    {SHIFT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        )}

                        {activeDrugAction.type === 'Dose' && (
                            <>
                                <div className="flex flex-col gap-1 text-black">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Dosage</label>
                                    <input type="text" placeholder="e.g. 500mg" className="p-2.5 md:p-3 bg-white border border-gray-300 rounded-xl text-black text-sm md:text-base font-bold outline-none" value={actionForm.newDose} onChange={e => setActionForm({...actionForm, newDose: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1 text-black">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Adjustment</label>
                                    <select className="p-2.5 md:p-3 bg-white border border-gray-300 rounded-xl text-black text-sm md:text-base font-bold outline-none [color-scheme:light]" value={actionForm.reason} onChange={e => setActionForm({...actionForm, reason: e.target.value})}>
                                        <option value="">Select Reason</option>
                                        {DOSE_CHANGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-1 text-black">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks / Details</label>
                            <textarea className="p-2.5 md:p-3 bg-white border border-gray-300 rounded-xl text-black text-sm md:text-base font-bold outline-none" rows={3} value={actionForm.remarks} onChange={e => setActionForm({...actionForm, remarks: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex gap-2 md:gap-3">
                        <button onClick={() => setActiveDrugAction(null)} className="flex-1 py-3 md:py-4 text-gray-500 font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-gray-100 rounded-xl md:rounded-2xl transition-all">Cancel</button>
                        <button onClick={handleDrugAction} disabled={loading} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">{loading ? '...' : 'Confirm'}</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDetailModal;