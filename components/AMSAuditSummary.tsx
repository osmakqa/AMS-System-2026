
import React from 'react';
import { AMSAudit, DrugType } from '../types';

interface AMSAuditSummaryProps {
  data: Partial<AMSAudit>;
  onSectionSelect?: (id: string, name: string) => void;
  highlightedSections?: string[];
}

const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1 flex items-center gap-2">
    {icon}
    {title}
  </h4>
);

const DataRow = ({ label, value, fullWidth = false }: { label: string, value: any, fullWidth?: boolean }) => (
  <div className={fullWidth ? 'col-span-full' : ''}>
    <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
    <p className="text-sm text-gray-800 font-medium break-words">{value || '—'}</p>
  </div>
);

interface SectionWrapperProps {
  id: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
  onSelect?: (id: string, title: string) => void;
  isHighlighted: boolean;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, title, children, className = '', onSelect, isHighlighted }) => {
  const isInteractive = !!onSelect;
  
  return (
    <div 
      onClick={(e) => {
        if (isInteractive && onSelect) {
          e.stopPropagation();
          onSelect(id, title);
        }
      }}
      className={`
        ${className} 
        ${isInteractive ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-green-400 relative group' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-sm' : ''}
      `}
    >
      {isInteractive && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold pointer-events-none">
          Click to Note
        </div>
      )}
      {children}
    </div>
  );
};

const AMSAuditSummary: React.FC<AMSAuditSummaryProps> = ({ data, onSectionSelect, highlightedSections = [] }) => {
  // Parse safe checks
  const abx = data.antimicrobials || [];
  const micro = data.microorganisms || [];
  const dx = data.diagnostics || {};
  const hist = data.history || {};
  const auditFindings = data.audit_findings || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Grid: Context & Patient */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audit Context */}
          <SectionWrapper 
            id="audit_context" 
            title="Audit Context" 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3"
            onSelect={onSectionSelect}
            isHighlighted={highlightedSections.includes("audit_context")}
          >
              <SectionHeader title="Audit Context" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <DataRow label="Auditor" value={data.auditor} />
                  <DataRow label="Area" value={data.area} />
                  <DataRow label="Date" value={data.audit_date ? new Date(data.audit_date).toLocaleDateString() : '—'} />
                  <DataRow label="Shift" value={data.shift} />
              </div>
          </SectionWrapper>

          {/* Patient Info */}
          <SectionWrapper 
            id="patient_details" 
            title="Patient Details" 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3"
            onSelect={onSectionSelect}
            isHighlighted={highlightedSections.includes("patient_details")}
          >
              <SectionHeader title="Patient Details" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Hospital No.</span>
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{data.patient_hosp_no}</span>
                  </div>
                  <DataRow label="DOB" value={data.patient_dob ? new Date(data.patient_dob).toLocaleDateString() : '—'} />
                  <DataRow label="Age" value={data.patient_age_string} />
                  <DataRow label="Weight" value={dx.weight ? `${dx.weight} kg` : '—'} />
                  <DataRow label="eGFR" value={dx.egfr || '—'} />
              </div>
          </SectionWrapper>
      </div>

      {/* Clinical Context */}
      <SectionWrapper 
        id="clinical_context" 
        title="Clinical Context" 
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
        onSelect={onSectionSelect}
        isHighlighted={highlightedSections.includes("clinical_context")}
      >
          <SectionHeader title="Clinical Context" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Biomarkers</span>
                  <p className="font-medium text-gray-800">
                    {dx.biomarkerUsed === 'Yes' 
                      ? `${dx.biomarkerType === 'Others' ? dx.biomarkerTypeOther : dx.biomarkerType} (${dx.fluidSample === 'Others' ? dx.fluidSampleOther : dx.fluidSample})` 
                      : 'Not Used'}
                  </p>
              </div>
              <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cultures</span>
                  <p className="font-medium text-gray-800">
                    {dx.cultureDone === 'Yes' 
                      ? `${dx.cultureSpecimen === 'Other' ? dx.cultureSpecimenOther : dx.cultureSpecimen}` 
                      : 'Not Done'}
                  </p>
              </div>
              <DataRow label="Prev Hospitalization (3mo)" value={hist.prevHosp3mo} />
              <DataRow label="Prev Antibiotics (1mo)" value={hist.prevAbx1mo} />
          </div>
      </SectionWrapper>

      {/* Antimicrobials */}
      <div>
           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
             Antimicrobials
           </h4>
           
           <div className="space-y-4">
               {abx.map((a: any, i: number) => {
                 const isRestricted = a.class === 'Restricted' || a.class === DrugType.RESTRICTED;
                 const borderColor = isRestricted ? 'border-red-200' : 'border-blue-200';
                 const headerBg = isRestricted ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100';
                 const drugTextColor = isRestricted ? 'text-red-800' : 'text-blue-800';
                 const badgeColor = isRestricted ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200';

                 return (
                   <SectionWrapper 
                     key={i} 
                     id={`drug_${i}`} 
                     title={`${a.drug} details`}
                     className={`rounded-xl border shadow-sm bg-white overflow-hidden ${borderColor}`}
                     onSelect={onSectionSelect}
                     isHighlighted={highlightedSections.includes(`drug_${i}`)}
                   >
                       {/* Header */}
                       <div className={`px-4 py-3 border-b flex justify-between items-center ${headerBg}`}>
                           <div className="flex items-center gap-3">
                               <span className={`font-bold text-lg ${drugTextColor}`}>{a.drug}</span>
                               <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${badgeColor}`}>{a.class}</span>
                           </div>
                           <div className="text-right">
                               <span className="block text-[10px] font-bold text-gray-400 uppercase">Start Date</span>
                               <span className="font-mono font-medium text-gray-700 text-sm">{a.startDate ? new Date(a.startDate).toLocaleDateString() : '—'}</span>
                           </div>
                       </div>

                       {/* Body */}
                       <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                           {/* Col 1: Regimen */}
                           <div className="space-y-3">
                               <div>
                                   <span className="block text-[10px] font-bold text-gray-400 uppercase">Regimen</span>
                                   <p className="font-semibold text-gray-800">{a.unitDose} {a.unit} {a.route} q{a.dosesPerDay ? (24/Number(a.dosesPerDay)).toFixed(0) : '?'}h</p>
                                   <p className="text-xs text-gray-500">({a.dosesPerDay} doses/day)</p>
                               </div>
                               <DataRow label="Treatment Type" value={a.treatment} />
                           </div>

                           {/* Col 2: Diagnosis & Indication */}
                           <div className="space-y-3">
                               <div>
                                   <span className="block text-[10px] font-bold text-gray-400 uppercase">Diagnosis Path</span>
                                   <div className="flex flex-wrap gap-1 mt-1">
                                       <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{a.diagnosis}</span>
                                       {a.systemSite && <span className="text-gray-300">›</span>}
                                       {a.systemSite && <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{a.systemSite}</span>}
                                       {a.subSite && <span className="text-gray-300">›</span>}
                                       {a.subSite && <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-bold">{a.subSite}</span>}
                                   </div>
                               </div>
                               <div>
                                   <span className="block text-[10px] font-bold text-gray-400 uppercase">Indication Path</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                       <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{a.indicationCategory}</span>
                                       {a.indicationSubCategory && <span className="text-gray-300">›</span>}
                                       {a.indicationSubCategory && <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{a.indicationSubCategory}</span>}
                                       {a.indicationSpecificType && <span className="text-gray-300">›</span>}
                                       {a.indicationSpecificType && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-bold">{a.indicationSpecificType}</span>}
                                   </div>
                               </div>
                           </div>

                           {/* Col 3: Compliance & Process */}
                           <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                               <div className="flex justify-between">
                                   <span className="text-gray-500 text-xs">Reason in Note?</span>
                                   <span className={`font-bold ${a.reasonInNote === 'Yes' ? 'text-green-600' : 'text-red-500'}`}>{a.reasonInNote}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span className="text-gray-500 text-xs">Guidelines Compliant?</span>
                                   <span className={`font-bold ${a.guidelinesCompliance === 'Yes' ? 'text-green-600' : 'text-orange-500'}`}>{a.guidelinesCompliance}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span className="text-gray-500 text-xs">Stop/Review Documented?</span>
                                   <span className={`font-bold ${a.stopReviewDocumented === 'Yes' ? 'text-green-600' : 'text-red-500'}`}>{a.stopReviewDocumented || '—'}</span>
                               </div>
                               {Number(a.missedN) > 0 && (
                                  <div className="pt-2 mt-2 border-t border-gray-200">
                                      <span className="block text-xs font-bold text-red-600 uppercase mb-1">Missed Doses</span>
                                      <p className="text-red-700 font-medium">{a.missedN} dose(s) - {a.missedReason}</p>
                                  </div>
                               )}
                           </div>
                       </div>
                   </SectionWrapper>
               )})}
           </div>
      </div>

      {/* Micro */}
      <SectionWrapper 
        id="microbiology" 
        title="Microbiology" 
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
        onSelect={onSectionSelect}
        isHighlighted={highlightedSections.includes("microbiology")}
      >
           <SectionHeader 
             title="Microbiology"
             icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
           />
           {micro.length > 0 ? (
             <div className="space-y-2">
                 {micro.map((m: any, i: number) => (
                     <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div>
                            <span className="font-bold text-gray-800">{m.organism || 'Unknown Organism'}</span>
                            {m.resistance && <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{m.resistance}</span>}
                        </div>
                        <span className="text-xs text-gray-500 italic">{m.note}</span>
                     </div>
                 ))}
             </div>
           ) : (
             <p className="text-sm text-gray-400 italic">No microbiology data recorded.</p>
           )}
      </SectionWrapper>

      {/* General Audit Note */}
      <SectionWrapper 
        id="general_note" 
        title="General Audit Notes" 
        className="bg-amber-50 p-4 rounded-xl border border-amber-200"
        onSelect={onSectionSelect}
        isHighlighted={highlightedSections.includes("general_note")}
      >
          <SectionHeader title="General Audit Notes" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} />
          <p className="text-sm text-amber-900 font-medium whitespace-pre-wrap">{data.general_audit_note || 'No general notes provided.'}</p>
      </SectionWrapper>

      {/* Review Findings */}
      {auditFindings.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <SectionHeader title="Reviewer Findings" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>} />
              <div className="space-y-3">
                  {auditFindings.map((f, idx) => (
                      <div key={idx} className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-md shadow-sm relative group">
                          <p className="text-xs font-bold text-indigo-800 uppercase mb-1">{f.section}</p>
                          <p className="text-sm font-bold text-gray-900">{f.category}</p>
                          <p className="text-xs text-gray-600 mt-1">{f.details}</p>
                          <div className="mt-2 text-right">
                              <span className="text-[10px] text-indigo-800 font-bold bg-white/40 px-1.5 py-0.5 rounded">Recorded by: {f.user} • {new Date(f.timestamp).toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default AMSAuditSummary;
