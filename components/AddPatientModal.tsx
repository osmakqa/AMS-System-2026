
import React, { useState, useEffect, useMemo } from 'react';
import { MonitoringPatient, MonitoringAntimicrobial, User, Prescription, PrescriptionStatus } from '../types';
import { fetchPrescriptions, createMonitoringPatient } from '../services/dataService';
import { WARDS } from '../constants';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select-patient' | 'select-meds' | 'confirm'>('select-patient');
  const [allRequests, setAllRequests] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);
  const [patientDetails, setPatientDetails] = useState<Partial<MonitoringPatient>>({});

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const { data } = await fetchPrescriptions();
        setAllRequests(data);
      };
      load();
      setStep('select-patient');
      setSelectedPatientId(null);
      setSelectedMedIds([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Group requests by patient
  const patients = useMemo(() => {
    const map = new Map<string, { name: string; hospNo: string; requests: Prescription[] }>();
    allRequests.forEach(r => {
      const key = `${r.patient_name}-${r.hospital_number}`;
      if (!map.has(key)) {
        map.set(key, { name: r.patient_name, hospNo: r.hospital_number, requests: [] });
      }
      map.get(key)!.requests.push(r);
    });
    const list = Array.from(map.values());
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(q) || p.hospNo.toLowerCase().includes(q));
  }, [allRequests, searchTerm]);

  const handleSelectPatient = (p: { name: string; hospNo: string; requests: Prescription[] }) => {
    const latestReq = p.requests[0];
    setPatientDetails({
      patient_name: p.name,
      hospital_number: p.hospNo,
      ward: latestReq.ward || '',
      bed_number: '',
      age: latestReq.age || '',
      sex: latestReq.sex || '',
      date_of_admission: new Date().toISOString().split('T')[0],
      latest_creatinine: latestReq.scr_mgdl === 'Pending' ? '' : latestReq.scr_mgdl || '',
      egfr: latestReq.egfr_text || '',
      infectious_diagnosis: latestReq.diagnosis || '',
      dialysis_status: 'No',
    });
    setSelectedPatientId(`${p.name}-${p.hospNo}`);
    setStep('select-meds');
  };

  const currentPatientRequests = useMemo(() => {
    if (!selectedPatientId) return [];
    return allRequests.filter(r => `${r.patient_name}-${r.hospital_number}` === selectedPatientId);
  }, [selectedPatientId, allRequests]);

  const toggleMed = (id: string) => {
    setSelectedMedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleConfirm = async () => {
    if (!patientDetails.ward || !patientDetails.bed_number) {
        alert("Please provide Ward and Bed Number.");
        return;
    }
    setLoading(true);
    try {
      const selectedRequests = currentPatientRequests.filter(r => selectedMedIds.includes(r.id));
      const antimicrobials: MonitoringAntimicrobial[] = selectedRequests.map(r => ({
        id: Math.random().toString(36).substr(2, 9),
        drug_name: r.antimicrobial,
        dose: r.dose || '',
        route: 'IV',
        frequency: r.frequency || '',
        frequency_hours: parseInt(r.frequency?.replace('q', '').replace('h', '') || '8'),
        start_date: r.req_date ? r.req_date.split('T')[0] : new Date().toISOString().split('T')[0],
        planned_duration: r.duration || '7',
        requesting_resident: r.resident_name || '',
        ids_in_charge: r.id_specialist || '',
        status: 'Active',
        administration_log: {}
      }));

      const payload: Partial<MonitoringPatient> = {
        ...patientDetails,
        antimicrobials,
        status: 'Admitted',
        last_updated_by: user?.name,
      } as MonitoringPatient;

      await createMonitoringPatient(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        <header className="bg-blue-600 text-white p-5 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold uppercase tracking-tight">Add Patient from Requests</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {step === 'select-patient' && (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search patient name or hospital number..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm bg-white text-black"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="grid gap-2">
                {patients.length > 0 ? patients.map(p => (
                  <button 
                    key={`${p.name}-${p.hospNo}`} 
                    onClick={() => handleSelectPatient(p)}
                    className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left shadow-sm group"
                  >
                    <div>
                      <div className="font-bold text-black group-hover:text-blue-700">{p.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{p.hospNo}</div>
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{p.requests.length} Request(s)</div>
                  </button>
                )) : <div className="text-center py-10 text-gray-400 italic">No patients found from previous requests.</div>}
              </div>
            </div>
          )}

          {step === 'select-meds' && (
            <div className="space-y-4">
              <button onClick={() => setStep('select-patient')} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline mb-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Change Patient
              </button>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Select Medications to Monitor</h4>
              <div className="space-y-2">
                {currentPatientRequests.map(r => (
                  <label key={r.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedMedIds.includes(r.id) ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}`}>
                    <input type="checkbox" checked={selectedMedIds.includes(r.id)} onChange={() => toggleMed(r.id)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <div className="font-bold text-black">{r.antimicrobial}</div>
                      <div className="text-xs text-gray-500">{r.dose} • {r.frequency} • {r.duration} days</div>
                    </div>
                    <div className="ml-auto">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${r.status === PrescriptionStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{r.status}</span>
                    </div>
                  </label>
                ))}
              </div>
              <button 
                disabled={selectedMedIds.length === 0} 
                onClick={() => setStep('confirm')} 
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all"
              >
                Next: Confirm Details
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6 animate-fade-in">
              <button onClick={() => setStep('select-meds')} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
              </button>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ward</label>
                  <select 
                    className="w-full p-2 rounded-lg border border-gray-300 text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                    value={patientDetails.ward} 
                    onChange={e => setPatientDetails({...patientDetails, ward: e.target.value})}
                  >
                    <option value="">Select Ward</option>
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bed Number</label>
                  <input 
                    className="w-full p-2 rounded-lg border border-gray-300 text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g. 4B" 
                    value={patientDetails.bed_number} 
                    onChange={e => setPatientDetails({...patientDetails, bed_number: e.target.value})} 
                  />
                </div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Monitoring Summary</h4>
                  <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-600">Patient:</span><span className="font-bold text-black">{patientDetails.patient_name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Age/Sex:</span><span className="font-bold text-black">{patientDetails.age} / {patientDetails.sex}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">SCr:</span><span className="font-bold text-black">{patientDetails.latest_creatinine}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Meds:</span><span className="font-bold text-black">{selectedMedIds.length} Selected</span></div>
                  </div>
              </div>
              <button 
                disabled={loading} 
                onClick={handleConfirm} 
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Adding...' : 'Start Monitoring'}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
