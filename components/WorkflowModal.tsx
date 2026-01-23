
import React from 'react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkflowStep = ({ number, title, description, statuses, color, icon }: { number: string, title: string, description: string, statuses: { text: string, color: string }[], color: string, icon: React.ReactNode }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border-t-4 transition-all hover:shadow-lg ${color}`}>
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-black flex-shrink-0 border-2 border-gray-200 shadow-sm">{number}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-gray-400">{icon}</div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight text-sm">{title}</h4>
        </div>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <span key={s.text} className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm tracking-widest uppercase ${s.color}`}>{s.text}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20 font-['Inter']" onClick={(e) => e.stopPropagation()}>
        {/* Enhanced Header - Explicit Inter styling */}
        <header className="flex items-center justify-between gap-4 bg-[#009a3e] text-white px-8 py-6 shadow-lg shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div className="font-['Inter']">
                <h3 className="text-2xl font-bold tracking-tight">System Workflow</h3>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.15em] mt-0.5">Antimicrobial Request for Monitored and Restricted</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        {/* Improved Workflow Content */}
        <div className="p-8 overflow-y-auto space-y-8 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Step 1 */}
            <WorkflowStep 
              number="01"
              title="Antimicrobial Request"
              description="The ordering Resident initiates the clinical request. For Restricted drugs, accountability involves the Resident in Charge and the Internal Medicine or Pediatric Medicine resident, who must record their names under the guidance of the assigned Infectious Disease Specialist."
              statuses={[{ text: 'PENDING', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' }]}
              color="border-yellow-400"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            />

            {/* Step 2 */}
            <WorkflowStep 
              number="02"
              title="Pharmacist Review"
              description="The Clinical Pharmacist validates the regimen. For MONITORED antimicrobials, the pharmacist may directly Approve or Disapprove. For RESTRICTED antimicrobials, the pharmacist may either Forward the request to the Infectious Disease Specialist or Disapprove the request."
              statuses={[
                { text: 'APPROVED', color: 'bg-green-50 text-green-700 border-green-200' },
                { text: 'DISAPPROVED', color: 'bg-red-50 text-red-700 border-red-200' },
                { text: 'FOR IDS APPROVAL', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
              ]}
              color="border-blue-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            />

            {/* Step 3 */}
            <WorkflowStep 
              number="03"
              title="Correction & Resubmission"
              description="For disapproved requests, structured findings are logged to guide corrections. The requesting Resident can log in to their dashboard to view these findings, amend the details, and resubmit for a new review cycle."
              statuses={[
                { text: 'RESUBMITTED', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { text: 'FINDINGS LOGGED', color: 'bg-orange-50 text-orange-700 border-orange-200' }
              ]}
              color="border-orange-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            />

            {/* Step 4 */}
            <WorkflowStep 
              number="04"
              title="Infectious Disease Specialist Review"
              description="The Infectious Disease Specialist performs the final clinical validation for Restricted Antimicrobials. If the Specialist disapproves the request, detailed findings are recorded to assist in optimizing the therapeutic regimen."
              statuses={[
                { text: 'FINAL APPROVAL', color: 'bg-green-50 text-green-700 border-green-200' },
                { text: 'FINAL DISAPPROVAL', color: 'bg-red-50 text-red-700 border-red-200' }
              ]}
              color="border-purple-600"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
            />

            {/* Step 5 */}
            <div className="md:col-span-2">
                <WorkflowStep 
                number="05"
                title="Continuous Quality Improvement"
                description="AMS Coordinators review real-time analytics on drug usage, turnaround times, and interventions to ensure compliance with clinical standards and facilitate program optimization."
                statuses={[
                    { text: 'DATA ANALYSIS', color: 'bg-teal-50 text-teal-700 border-teal-200' },
                    { text: 'OUTCOMES', color: 'bg-gray-50 text-gray-700 border-gray-200' }
                ]}
                color="border-teal-500"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
            </div>
          </div>
        </div>
        
        {/* Enhanced Footer */}
        <footer className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] py-6 border-t border-gray-100 bg-white shrink-0">
          Ospital ng Makati
        </footer>
      </div>
    </div>
  );
};

export default WorkflowModal;
