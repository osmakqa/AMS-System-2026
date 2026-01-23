import React, { useState, useEffect } from 'react';
import { MonitoringPatient, User } from '../types';
import { updateMonitoringPatient } from '../services/dataService';
import { WARDS } from '../constants';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: MonitoringPatient;
  user: User | null;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ isOpen, onClose, patient, user }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<MonitoringPatient>>({});

  useEffect(() => {
    if (isOpen && patient) {
        setFormData({
            patient_name: patient.patient_name,
            ward: patient.ward,
            bed_number: patient.bed_number,
            age: patient.age,
            sex: patient.sex,
            latest_creatinine: patient.latest_creatinine,
            infectious_diagnosis: patient.infectious_diagnosis,
            dialysis_status: patient.dialysis_status,
            status: patient.status
        });
    }
  }, [isOpen, patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMonitoringPatient(patient.id, {
        ...formData,
        last_updated_by: user?.name
      });
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-0 md:p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full max-w-lg h-full md:h-auto overflow-hidden animate-fade-in flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="bg-blue-600 text-white p-4 md:p-5 flex justify-between items-center shrink-0">
          <h3 className="text-md md:text-lg font-bold uppercase tracking-tight">Edit Patient</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
            <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Patient Name</label>
                <input 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  value={formData.patient_name} 
                  onChange={e => setFormData({...formData, patient_name: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ward</label>
                <select 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all [color-scheme:light]" 
                  value={formData.ward} 
                  onChange={e => setFormData({...formData, ward: e.target.value})}
                >
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bed Number</label>
                <input 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  value={formData.bed_number} 
                  onChange={e => setFormData({...formData, bed_number: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Age</label>
                <input 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  type="text" 
                  value={formData.age} 
                  onChange={e => setFormData({...formData, age: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sex</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all [color-scheme:light]" 
                  value={formData.sex} 
                  onChange={e => setFormData({...formData, sex: e.target.value})}
                >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Infectious Diagnosis</label>
                <input 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  value={formData.infectious_diagnosis} 
                  onChange={e => setFormData({...formData, infectious_diagnosis: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admission Status</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all [color-scheme:light]" 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                    <option value="Admitted">Admitted</option>
                    <option value="Discharged">Discharged</option>
                    <option value="Expired">Expired</option>
                </select>
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dialysis Status</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500 transition-all [color-scheme:light]" 
                  value={formData.dialysis_status} 
                  onChange={e => setFormData({...formData, dialysis_status: e.target.value as any})}
                >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm text-gray-500 font-black uppercase tracking-widest hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;