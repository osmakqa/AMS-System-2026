
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        <header className="bg-blue-600 text-white p-5 flex justify-between items-center">
          <h3 className="font-bold uppercase tracking-tight">Edit Patient Details</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-black">
            <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Patient Name</label>
                <input 
                  required 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.patient_name} 
                  onChange={e => setFormData({...formData, patient_name: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ward</label>
                <select 
                  required 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.ward} 
                  onChange={e => setFormData({...formData, ward: e.target.value})}
                >
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bed</label>
                <input 
                  required 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.bed_number} 
                  onChange={e => setFormData({...formData, bed_number: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Age</label>
                <input 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  type="number" 
                  value={formData.age} 
                  onChange={e => setFormData({...formData, age: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sex</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.sex} 
                  onChange={e => setFormData({...formData, sex: e.target.value})}
                >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
            <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Infectious Diagnosis</label>
                <input 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.infectious_diagnosis} 
                  onChange={e => setFormData({...formData, infectious_diagnosis: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Patient Status</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                    <option value="Admitted">Admitted</option>
                    <option value="Discharged">Discharged</option>
                    <option value="Expired">Expired</option>
                </select>
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dialysis</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.dialysis_status} 
                  onChange={e => setFormData({...formData, dialysis_status: e.target.value as any})}
                >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 font-bold hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors">
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;
