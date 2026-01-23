
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

  // Dynamically calculate the number of columns based on the max planned_duration
  const dayColumns = useMemo(() => {
    if (!patient || !patient.antimicrobials || patient.antimicrobials.length === 0) {
      return Array.from({ length: 7 }, (_, i) => i + 1);
    }
    const maxDuration = Math.max(...patient.antimicrobials.map(a => {
        const d = parseInt(a.planned_duration);
        return isNaN(d) ? 7 : d;
    }));
    // We show at least 7 days for visibility, or the max duration
    return Array.from({ length: Math.max(7, maxDuration) }, (_, i) => i + 1);
  }, [patient]);

  useEffect(() => {
    if (isAddingMed && patient) {
        const loadRequests = async () => {
            setFetchingRequests(true);
            try {
                const { data } = await fetchPrescriptions();
                // Filter requests for THIS patient
                const patientRequests = data.filter(r => 
                    r.hospital_number === patient.hospital_number || 
                    r.patient_name.toLowerCase().includes(patient.patient_name.toLowerCase())
                );
                
                // Further filter out drugs ALREADY being monitored
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden border border-gray-100 relative" onClick={(e) => e.stopPropagation()}>
        
        <header className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">{patient.patient_name}</h3>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{patient.hospital_number} • {patient.ward} • Adm: {patient.date_of_admission}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <div className="flex-1 flex overflow-hidden bg-white">
            
            {/* LEFT COLUMN: Clinical Context & Actions */}
            <div className="w-[300px] border-r border-gray-200 overflow-y-auto p-4 space-y-6 bg-gray-50/30">
                <section className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-50 pb-1">Clinical Profile</h4>
                    <div className="space-y-3 text-black">
                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">Age / Sex</p><p className="text-sm font-bold">{patient.age} / {patient.sex}</p></div>
                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">eGFR (Latest SCr: {patient.latest_creatinine})</p><p className="text-sm font-bold text-blue-700">{patient.egfr}</p></div>
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

            {/* FLOWSHEET */}
            <div className="flex-1 overflow-auto p-4 bg-white relative">
                <div className="inline-block min-w-full border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full border-collapse table-fixed">
                        <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200 text-black">
                            <tr>
                                <th className="p-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-200 bg-gray-50 sticky left-0 z-30 w-60 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">Antimicrobial / Scheduled Times</th>
                                {dayColumns.map(day => (
                                    <th key={day} className="p-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-200 min-w-[70px]">
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
                                            <td className="p-3 border-r border-gray-200 sticky left-0 z-10 bg-gray-50 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                                                <div className="font-black text-xs text-black uppercase tracking-tight">{drug.drug_name}</div>
                                                <div className="text-[9px] text-gray-500 font-bold uppercase">{drug.dose} • {drug.route} • {drug.frequency}</div>
                                                <div className="text-[8px] text-blue-600 font-black uppercase mt-0.5">Target: {plannedDuration} days</div>
                                            </td>
                                            {dayColumns.map(day => {
                                                const isBeyond = day > plannedDuration;
                                                return <td key={day} className={`border-r border-gray-100 ${isBeyond ? 'bg-gray-200/40' : 'bg-gray-50/30'}`} />;
                                            })}
                                        </tr>
                                        {/* Dose rows with Time in First Column */}
                                        {Array.from({ length: dosesPerDay }).map((_, doseIdx) => (
                                            <tr key={`${drug.id}-${doseIdx}`} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="p-2 border-r border-gray-200 sticky left-0 z-10 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.02)] flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-gray-400 shrink-0">Dose {doseIdx + 1}:</span>
                                                    <input 
                                                        type="time" 
                                                        className="flex-1 text-xs font-bold border border-gray-200 bg-gray-50 text-gray-800 p-1 px-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white [color-scheme:light]"
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
                                                            className={`p-2 border-r border-gray-100 text-center transition-all ${isActive ? 'cursor-pointer hover:bg-blue-100' : (isBeyond ? 'bg-gray-200/50 cursor-not-allowed' : 'bg-gray-50 opacity-40')}`}
                                                            onClick={() => isActive && setCellAction({ drugId: drug.id, day, doseIndex: doseIdx })}
                                                        >
                                                            {logEntry ? (
                                                                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-[10px] font-black border shadow-sm ${logEntry.status === 'Given' ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'}`} title={logEntry.user ? `Logged by ${logEntry.user}` : ''}>
                                                                    {logEntry.status === 'Given' ? 'G' : 'M'}
                                                                </div>
                                                            ) : (
                                                                isBeyond ? (
                                                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-400 opacity-30 select-none">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor opacity-20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 mx-auto border border-gray-200 rounded-md border-dashed bg-gray-50/50" />
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

                <div className="mt-6 flex gap-6 text-[9px] font-black uppercase text-gray-400 tracking-widest flex-wrap">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-600 rounded border border-green-700" /> Given (G)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded border border-red-700" /> Missed (M)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border border-gray-200 border-dashed rounded bg-gray-50" /> Not Logged</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 rounded border border-gray-300" /> Beyond Requested Duration</div>
                </div>
            </div>
        </div>

        {/* Add Medication Overlay */}
        {isAddingMed && (
            <div className="absolute inset-0 bg-black/40 z-[280] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsAddingMed(false)}>
                <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-200 animate-slide-up flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xl font-black text-black uppercase tracking-tight">Add Antimicrobial</h4>
                        <button onClick={() => setIsAddingMed(false)} className="text-gray-400 hover:text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-6 font-bold uppercase tracking-widest">Select from patient's clinical requests</p>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {fetchingRequests ? (
                             <div className="text-center py-10 text-gray-400">Loading requests...</div>
                        ) : availableRequests.length > 0 ? (
                            availableRequests.map(req => (
                                <button 
                                    key={req.id} 
                                    onClick={() => handleAddMedFromRequest(req)}
                                    className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition-all group"
                                >
                                    <div className="font-black text-black group-hover:text-blue-700">{req.antimicrobial}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{req.dose} • {req.frequency} • {req.duration} days</div>
                                    <div className="text-[9px] text-blue-500 font-bold mt-2 italic">Requested on {new Date(req.req_date).toLocaleDateString()}</div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No matching requests found</p>
                            </div>
                        )}
                    </div>
                    
                    <button onClick={() => setIsAddingMed(false)} className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Cancel</button>
                </div>
            </div>
        )}

        {/* Undo Confirmation Overlay */}
        {pendingUndo && (
            <div className="absolute inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPendingUndo(null)}>
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 animate-slide-up" onClick={e => e.stopPropagation()}>
                    <h4 className="text-xl font-black text-black uppercase tracking-tight mb-2">Are you sure?</h4>
                    <p className="text-xs text-gray-500 mb-6 font-bold uppercase tracking-widest">Revert this medication to active status?</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => handleUndoStatus(pendingUndo)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            Yes, Revert to Active
                        </button>
                        <button 
                            onClick={() => setPendingUndo(null)}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                        >
                            No, Keep Current Status
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Cell Action Dialog */}
        {cellAction && (
             <div className="absolute inset-0 bg-black/40 z-[250] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setCellAction(null)}>
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 animate-slide-up" onClick={e => e.stopPropagation()}>
                    <h4 className="text-xl font-black text-black uppercase tracking-tight mb-2">Administration Log</h4>
                    <p className="text-xs text-gray-500 mb-6 font-bold uppercase tracking-widest">Record action for Day {cellAction.day} dose</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => updateCellStatus('Given')}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-green-200 active:scale-95"
                        >
                            Mark as Given
                        </button>
                        <button 
                            onClick={() => updateCellStatus('Missed')}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-200 active:scale-95"
                        >
                            Mark as Missed
                        </button>
                        <button 
                            onClick={() => updateCellStatus(null)}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                        >
                            Clear Entry
                        </button>
                    </div>
                    <button onClick={() => setCellAction(null)} className="mt-6 w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancel</button>
                </div>
             </div>
        )}

        {/* Action Overlay Modals */}
        {activeDrugAction && (
            <div className="absolute inset-0 bg-white/95 z-[200] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-black uppercase tracking-tight">{activeDrugAction.type} Medication</h3>
                        <button onClick={() => setActiveDrugAction(null)} className="text-gray-400 hover:text-black"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>

                    <div className="space-y-4">
                        {activeDrugAction.type === 'Stop' && (
                            <div className="flex flex-col gap-1 text-black">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Stopping</label>
                                <select className="p-3 bg-white border border-gray-300 rounded-xl text-black font-bold outline-none [color-scheme:light]" value={actionForm.reason} onChange={e => setActionForm({...actionForm, reason: e.target.value})}>
                                    <option value="">Select Reason</option>
                                    {STOP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        )}

                        {activeDrugAction.type === 'Shift' && (
                            <div className="flex flex-col gap-1 text-black">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Shifting</label>
                                <select className="p-3 bg-white border border-gray-300 rounded-xl text-black font-bold outline-none [color-scheme:light]" value={actionForm.reason} onChange={e => setActionForm({...actionForm, reason: e.target.value})}>
                                    <option value="">Select Reason</option>
                                    {SHIFT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        )}

                        {activeDrugAction.type === 'Dose' && (
                            <>
                                <div className="flex flex-col gap-1 text-black">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Dosage</label>
                                    <input type="text" placeholder="e.g. 500mg" className="p-3 bg-white border border-gray-300 rounded-xl text-black font-bold outline-none" value={actionForm.newDose} onChange={e => setActionForm({...actionForm, newDose: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1 text-black">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Adjustment</label>
                                    <select className="p-3 bg-white border border-gray-300 rounded-xl text-black font-bold outline-none [color-scheme:light]" value={actionForm.reason} onChange={e => setActionForm({...actionForm, reason: e.target.value})}>
                                        <option value="">Select Reason</option>
                                        {DOSE_CHANGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-1 text-black">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks / Details</label>
                            <textarea className="p-3 bg-white border border-gray-300 rounded-xl text-black font-bold outline-none" rows={3} value={actionForm.remarks} onChange={e => setActionForm({...actionForm, remarks: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setActiveDrugAction(null)} className="flex-1 py-4 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                        <button onClick={handleDrugAction} disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">{loading ? 'Processing...' : 'Confirm Action'}</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDetailModal;
