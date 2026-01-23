
import React from 'react';
import { MonitoringPatient, MonitoringAntimicrobial, AdminLogEntry } from '../types';

interface MonitoringPatientCardProps {
  patient: MonitoringPatient;
  onClick: (patient: MonitoringPatient) => void;
}

// --- SVG Icons ---
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// --- Helper Functions (copied from modal for card display) ---
const normalizeLogEntry = (entry: string | AdminLogEntry | null): AdminLogEntry | null => {
    if (!entry) return null;
    if (typeof entry === 'string') return { time: entry, status: 'Given' };
    return entry;
};

const calculateDoseBasedDuration = (drug: MonitoringAntimicrobial): string => {
  if (!drug) return "—";
  const totalDosesGiven = drug.administration_log 
    ? Object.values(drug.administration_log)
        .flat()
        .filter(entry => normalizeLogEntry(entry)?.status === 'Given')
        .length
    : 0;

  if (totalDosesGiven === 0) {
      return "0 doses";
  }
  
  if (!drug.frequency_hours || drug.frequency_hours <= 0) {
      return `${totalDosesGiven} doses`;
  }
  
  const dosesPerDay = Math.max(1, Math.floor(24 / drug.frequency_hours));

  if (dosesPerDay <= 1) {
      return `Day ${totalDosesGiven}`;
  } else {
      const fullDays = Math.floor(totalDosesGiven / dosesPerDay);
      const extraDoses = totalDosesGiven % dosesPerDay;

      if (extraDoses === 0 && fullDays > 0) {
          return `Day ${fullDays}`;
      }
      if (fullDays === 0) {
          return `${extraDoses} doses`;
      }
      return `Day ${fullDays} + ${extraDoses}`;
  }
};


const MonitoringPatientCard: React.FC<MonitoringPatientCardProps> = ({ patient, onClick }) => {
  if (!patient) return null;
  const activeDrugs = patient.antimicrobials?.filter(a => a && a.status === 'Active') || [];
  
  // --- Styling ---
  const statusConfig = {
    Admitted: { border: 'border-blue-500', badge: 'bg-blue-100 text-blue-800', badgeText: 'Active' },
    Discharged: { border: 'border-gray-400', badge: 'bg-gray-100 text-gray-800', badgeText: 'Discharged' },
    Expired: { border: 'border-red-500', badge: 'bg-red-100 text-red-800', badgeText: 'Expired' },
  };
  const currentStatus = (statusConfig as any)[patient.status] || statusConfig.Admitted;


  return (
    <div 
      onClick={() => onClick(patient)}
      className={`bg-white rounded-xl shadow-md border border-gray-200/80 border-l-4 ${currentStatus.border} p-4 cursor-pointer hover:shadow-xl hover:border-blue-500 hover:ring-2 hover:ring-blue-200 transition-all duration-300 flex flex-col h-full group`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
            <h3 className="font-extrabold text-lg text-gray-800 group-hover:text-blue-700 transition-colors leading-tight">{patient.patient_name}</h3>
            <p className="text-xs text-gray-500 font-mono mt-1">{patient.hospital_number}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentStatus.badge}`}>{currentStatus.badgeText}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 border-t border-gray-100 pt-3">
         <LocationIcon />
         <span className="font-semibold">{patient.ward}</span>
         <span>-</span>
         <span>Bed {patient.bed_number}</span>
      </div>

      {/* Active Antimicrobials List */}
      <div className="mt-auto border-t border-gray-100 pt-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Active Antimicrobials</h4>
        {activeDrugs.length > 0 ? (
          <div className="space-y-1.5">
            {activeDrugs.map(drug => {
              const durationString = calculateDoseBasedDuration(drug);
              return (
                <div key={drug.id} className="text-xs font-medium bg-blue-50 text-blue-800 px-2 py-1 rounded-md border border-blue-100 flex justify-between items-center">
                  <span>{drug.drug_name}</span>
                  <span className="font-bold">{durationString}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No active therapies.</p>
        )}
      </div>
    </div>
  );
};

export default MonitoringPatientCard;
