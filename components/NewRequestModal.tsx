

import React, { useState, useEffect } from 'react';
import { DrugType } from '../types';
import { IDS_SPECIALISTS } from '../constants';
import { PEDIATRIC_MONOGRAPHS } from '../data/pediatricMonographs';
import { verifyPediatricDosing } from '../services/geminiService';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    req_date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })(),
    patient_name: '', hospital_number: '', age: '', sex: '', weight_kg: '', height_cm: '', ward: '',
    mode: 'adult', // New field with default
    diagnosis: '', sgpt: '', scr_mgdl: '', egfr_text: '',
    antimicrobial: '', // Renamed from drug_name
    drug_type: DrugType.RESTRICTED, dose: '', frequency: '', duration: '',
    indication: '', basis_indication: '',
    previous_antibiotics: '', organisms: '', specimen: '',
    resident_name: '', clinical_dept: '', service_resident_name: '', id_specialist: '',
    notes: ''
  });

  const [dosingCheck, setDosingCheck] = useState<{ isSafe: boolean; message: string } | null>(null);
  const [isCheckingDose, setIsCheckingDose] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (formData.mode === 'pediatric' && formData.antimicrobial && formData.weight_kg && formData.dose) {
        setIsCheckingDose(true);
        const monograph = PEDIATRIC_MONOGRAPHS[formData.antimicrobial];
        if (monograph) {
          const result = await verifyPediatricDosing(
            formData.antimicrobial, 
            formData.weight_kg, 
            formData.age, 
            formData.dose, 
            formData.frequency, 
            monograph.dosing
          );
          if (active && result) setDosingCheck(result);
        }
        if (active) setIsCheckingDose(false);
      } else {
        setDosingCheck(null);
      }
    };
    
    const timeout = setTimeout(check, 1000);
    return () => { active = false; clearTimeout(timeout); };
  }, [formData.mode, formData.antimicrobial, formData.weight_kg, formData.dose, formData.frequency, formData.age]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, req_date: new Date(formData.req_date).toISOString() });
  };

  const FormGroup = ({ label, children }: { label: string, children?: React.ReactNode }) => (<div className="mb-2"><label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>{children}</div>);
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-900 [color-scheme:light]" />;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 overflow-y-auto max-h-[95vh] flex flex-col">
        <h3 className="text-xl font-bold text-green-800 mb-4 pb-2 border-b border-gray-200">New Antimicrobial Request</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-3 rounded border border-gray-200"><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Patient Information</h4><div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormGroup label="Request Date"><Input type="date" required name="req_date" value={formData.req_date} onChange={handleChange} /></FormGroup>
            <FormGroup label="Patient Name (Last, First)"><Input required name="patient_name" value={formData.patient_name} onChange={handleChange} placeholder="e.g. Dela Cruz, Juan" /></FormGroup>
            <FormGroup label="Hospital Number"><Input required name="hospital_number" value={formData.hospital_number} onChange={handleChange} placeholder="ID Number" /></FormGroup>
            <FormGroup label="Patient Mode">
              <select required name="mode" value={formData.mode} onChange={handleChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900 [color-scheme:light]">
                <option value="adult">Adult</option>
                <option value="pediatric">Pediatric</option>
              </select>
            </FormGroup>
            <FormGroup label="Age"><Input name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 45" /></FormGroup>
            <FormGroup label="Sex"><select name="sex" value={formData.sex} onChange={handleChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900 [color-scheme:light]"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></FormGroup>
            <FormGroup label="Weight (kg)"><Input name="weight_kg" value={formData.weight_kg} onChange={handleChange} /></FormGroup>
            <FormGroup label="Height (cm)"><Input name="height_cm" value={formData.height_cm} onChange={handleChange} /></FormGroup>
            <div className="md:col-span-2"><FormGroup label="Ward / Location"><Input required name="ward" value={formData.ward} onChange={handleChange} /></FormGroup></div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-200"><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Clinical Data</h4><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="md:col-span-2"><FormGroup label="Diagnosis"><Input name="diagnosis" value={formData.diagnosis} onChange={handleChange} /></FormGroup></div><div className="md:col-span-2"><FormGroup label="Indication"><Input name="indication" value={formData.indication} onChange={handleChange} /></FormGroup></div><FormGroup label="SGPT"><Input name="sgpt" value={formData.sgpt} onChange={handleChange} /></FormGroup><FormGroup label="SCr (mg/dL)"><Input name="scr_mgdl" value={formData.scr_mgdl} onChange={handleChange} /></FormGroup><div className="md:col-span-2"><FormGroup label="eGFR"><Input name="egfr_text" value={formData.egfr_text} onChange={handleChange} placeholder="Value or Text" /></FormGroup></div><div className="md:col-span-4"><FormGroup label="Basis of Indication"><Input name="basis_indication" value={formData.basis_indication} onChange={handleChange} /></FormGroup></div></div></div>
          
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Medication</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2"><FormGroup label="Antimicrobial (Drug Name)"><Input required name="antimicrobial" value={formData.antimicrobial} onChange={handleChange} /></FormGroup></div>
              <FormGroup label="Drug Type"><select name="drug_type" value={formData.drug_type} onChange={handleChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900 [color-scheme:light]"><option value={DrugType.RESTRICTED}>Restricted</option><option value={DrugType.MONITORED}>Monitored</option></select></FormGroup>
              <FormGroup label="Dose"><Input name="dose" value={formData.dose} onChange={handleChange} placeholder="e.g. 1g" /></FormGroup>
              <FormGroup label="Frequency"><Input name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g. q8h" /></FormGroup>
              <FormGroup label="Duration"><Input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 7 days" /></FormGroup>
            </div>

            {/* Pediatric Check UI in Create Modal */}
            {(isCheckingDose || dosingCheck) && (
             <div className={`mt-3 p-3 rounded border-l-4 text-xs ${dosingCheck?.isSafe ? 'bg-green-50 border-green-500 text-green-800' : 'bg-yellow-50 border-yellow-500 text-yellow-800'}`}>
                {isCheckingDose ? 'Checking pediatric dosing...' : (
                   <div className="flex gap-2">
                      <span className="font-bold">{dosingCheck?.isSafe ? 'OK:' : 'ALERT:'}</span>
                      <span>{dosingCheck?.message}</span>
                   </div>
                )}
             </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-3 rounded border border-gray-200"><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Microbiology & History</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormGroup label="Previous Antibiotics"><textarea name="previous_antibiotics" value={formData.previous_antibiotics} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-900" placeholder={'Drug: Drug 1\nFrequency: OD\nDuration: 7 days'} /></FormGroup><FormGroup label="Organisms / Specimen"><textarea name="organisms" value={formData.organisms} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-900" placeholder={'Name: E. coli\nSusceptibilities:\nDrug: Drug 1 Result: S'} /></FormGroup><FormGroup label="Specimen Source"><Input name="specimen" value={formData.specimen} onChange={handleChange} placeholder="e.g. Blood, Urine" /></FormGroup></div></div>
          <div className="bg-gray-50 p-3 rounded border border-gray-200"><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Personnel</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormGroup label="Resident In-Charge"><Input name="resident_name" value={formData.resident_name} onChange={handleChange} /></FormGroup><FormGroup label="Service Resident"><Input name="service_resident_name" value={formData.service_resident_name} onChange={handleChange} /></FormGroup><FormGroup label="Clinical Dept"><Input name="clinical_dept" value={formData.clinical_dept} onChange={handleChange} /></FormGroup><FormGroup label="ID Specialist"><select name="id_specialist" value={formData.id_specialist} onChange={handleChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900 [color-scheme:light]"><option value="">Select Specialist</option>{IDS_SPECIALISTS.map(name => (<option key={name} value={name}>{name}</option>))}</select></FormGroup></div></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200"><button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium" disabled={loading}>Cancel</button><button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium shadow-sm flex items-center">{loading ? 'Saving...' : 'Submit Request'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default NewRequestModal;