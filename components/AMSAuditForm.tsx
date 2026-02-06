
import React, { useState, useEffect, useRef } from 'react';
import { createAudit, updateAudit } from '../services/dataService';
import { AMSAudit, DrugType } from '../types';
import AMSAuditSummary from './AMSAuditSummary';
import { checkRenalDosing, verifyWeightBasedDosing, verifyPediatricDosing } from '../services/geminiService';
import { ADULT_MONOGRAPHS } from '../data/adultMonographs';
import { PEDIATRIC_MONOGRAPHS } from '../data/pediatricMonographs';
import { MONITORED_DRUGS, RESTRICTED_DRUGS, WARDS } from '../constants';

// --- CONSTANTS ---
const AREAS = [
  ...WARDS,
  "Others (Specify)"
];

const AUDITORS = ["Max", "Micha", "Miko", "Belle", "Michael"];
const SHIFTS = ["6 to 2", "2 to 10", "10 to 6"];

const INDICATION_CATEGORIES_OPTIONS = ["CAI", "HAI", "SP", "MP", "OTH", "UNK"];
const HAI_SUB_CATEGORIES_OPTIONS = ["HAI1", "HAI2", "HAI3", "HAI4", "HAI5", "HAI6"];
const HAI2_SPECIFIC_OPTIONS = ["HAI2-CVC-BSI", "HAI2-PVC-BSI", "HAI2-VAP", "HAI2-CAUTI"];
const SP_TYPES_OPTIONS = ["SP1", "SP2", "SP3"];

const SITE_CATEGORIES = ["CNS", "EYE", "ENT", "RESP", "CVS", "GI", "SSTBJ", "UTI", "GUOB", "No defined site (NDS)"];

const THER_CODES: Record<string, string[]> = {
  "CNS": ["CNS", "Proph CNS"],
  "EYE": ["EYE", "Proph EYE"],
  "ENT": ["ENT", "AOM", "Proph ENT"],
  "RESP": ["LUNG", "URTI", "Bron", "Pneu", "COVID-19", "TB", "CF", "Proph RESP"],
  "CVS": ["CVS", "Proph CVS"],
  "GI": ["GI", "IA", "CDIF", "Proph GI"],
  "SSTBJ": ["SST", "BJ", "Proph BJ"],
  "UTI": ["Cys", "Pye", "ASB", "Proph UTI"],
  "GUOB": ["OBGY", "GUM", "Proph OBGY"],
  "No defined site (NDS)": ["BAC", "SEPSIS", "Malaria", "HIV", "PUO", "PUO-HO", "FN", "LYMPH", "Sys-DI", "Other", "MP-GEN", "UNK", "PROK"]
};

const PROPH_CODES: Record<string, string[]> = {
  "CNS": ["Proph CNS"],
  "EYE": ["Proph EYE"],
  "ENT": ["Proph ENT"],
  "RESP": ["Proph RESP"],
  "CVS": ["Proph CVS"],
  "GI": ["Proph GI"],
  "SSTBJ": ["Proph BJ"],
  "UTI": ["Proph UTI"],
  "GUOB": ["Proph OBGY"],
  "No defined site (NDS)": ["MP-GEN", "UNK", "PROK", "BAC", "SEPSIS", "Malaria", "HIV", "PUO", "PUO-HO", "FN", "LYMPH", "Sys-DI", "Other"], 
  "Neonatal": ["MP-MAT", "NEO-MP", "CLD"]
};

const NEO_CODES = ["MP-MAT", "NEO-MP", "CLD"];

const CODE_DESCRIPTIONS: Record<string, string> = {
  "Proph CNS": "Prophylaxis for CNS (neurosurgery, meningococcal)",
  "CNS": "Infections of the Central Nervous System",
  "Proph EYE": "Prophylaxis for Eye operations",
  "EYE": "Therapy for Eye infections (e.g., endophthalmitis)",
  "Proph ENT": "Prophylaxis for Ear, Nose, Throat (surgical or medical prophylaxis = SP/MP)",
  "ENT": "Therapy for Ear, Nose, Throat infections including mouth, sinuses, larynx",
  "AOM": "Acute otitis media",
  "Proph RESP": "Pulmonary surgery, prophylaxis for respiratory pathogens (e.g., aspergillosis)",
  "LUNG": "Lung abscess including aspergilloma",
  "URTI": "Upper respiratory tract viral infections (including influenza but not ENT)",
  "Bron": "Acute bronchitis or exacerbations of chronic bronchitis",
  "Pneu": "Pneumonia or LRTI (lower respiratory tract infections)",
  "COVID-19": "Coronavirus disease caused by SARS-CoV-2 infection",
  "TB": "Pulmonary tuberculosis",
  "CF": "Cystic fibrosis",
  "Proph CVS": "Cardiac or vascular surgery prophylaxis; endocarditis prophylaxis",
  "CVS": "Cardiovascular system infections: endocarditis, endovascular device infection (e.g., pacemaker, vascular graft)",
  "Proph GI": "Gastrointestinal tract surgery, liver/biliary tree procedures; GI prophylaxis in neutropenic patients or hepatic failure",
  "GI": "Gastrointestinal infections (salmononellosis, Campylobacter, parasitic infections)",
  "IA": "Intra-abdominal sepsis including hepatobiliary and intra-abdominal abscess",
  "CDIF": "Clostridioides difficile infection",
  "Proph BJ": "Prophylaxis for Skin & Soft Tissue (SST), plastic or orthopedic surgery (Bone or Joint)",
  "SST": "Skin and soft tissue infections: cellulitis, surgical site infection, deep soft tissue infection not involving bone (e.g., infected pressure ulcer, diabetic ulcer, abscess)",
  "BJ": "Bone/Joint infections: septic arthritis (including prosthetic joint), osteomyelitis",
  "Proph UTI": "Prophylaxis for urological surgery (SP) or recurrent urinary tract infection (MP)",
  "Cys": "Lower urinary tract infection (UTI): cystitis",
  "Pye": "Upper UTI including catheter-related UTI, pyelonephritis",
  "ASB": "Asymptomatic bacteriuria",
  "Proph OBGY": "Prophylaxis for obstetric or gynecological surgery (SP: caesarean section, no episiotomy; MP: carriage of group B streptococcus)",
  "OBGY": "Obstetric/gynecological infections, sexually transmitted diseases (STD) in women",
  "GUM": "Genito-urinary males + prostatitis, epididymo-orchitis, STD in men",
  "BAC": "Bacteraemia or fungaemia with no clear anatomic site and no shock",
  "SEPSIS": "Sepsis of any origin (e.g., urosepsis, pulmonary sepsis), sepsis syndrome or septic shock with no clear anatomic site; includes fungaemia (candidemia) with septic symptoms",
  "Malaria": "Malaria",
  "HIV": "Human immunodeficiency virus",
  "PUO": "Pyrexia of Unknown Origin; fever syndrome without identified source or site",
  "PUO-HO": "Fever syndrome in non-neutropenic hemato-oncology patients with no identified source",
  "FN": "Fever in the neutropenic patient",
  "LYMPH": "Lymphatics as the primary source of infection (e.g., suppurative lymphadenitis)",
  "Sys-DI": "Disseminated infection (viral infections such as measles, CMV, etc.)",
  "Other": "Antimicrobial prescribed with documentation but no defined diagnosis group",
  "MP-GEN": "Medical prophylaxis in general without targeting a specific site (e.g., antifungal prophylaxis during immunosuppression)",
  "UNK": "Completely unknown indication",
  "PROK": "Antimicrobial (e.g., erythromycin) prescribed for prokinetic use",
  "MP-MAT": "Medical prophylaxis for maternal risk factors (e.g., prolonged rupture of membranes)",
  "NEO-MP": "Medical prophylaxis for newborn risk factors (e.g., VLBW, IUGR)",
  "CLD": "Chronic lung disease: long-term respiratory problems in premature babies (bronchopulmonary dysplasia)",
  "CAI": "Community-acquired infection: Symptoms started ≤48 hours from admission (or present on admission).",
  "HAI": "Healthcare-associated infection: Symptoms start >48 hours after admission.",
  "HAI1": "Post-operative surgical site infection (within 30 days of surgery OR 90 days after implant surgery).",
  "HAI2": "Intervention-related infections of mixed origin (mix of CVC-BSI, PVC-BSI, VAP, CAUTI; or infections related to tubes/drains).",
  "HAI2-CVC-BSI": "Central venous catheter-related bloodstream infection.",
  "HAI2-PVC-BSI": "Peripheral vascular catheter-related bloodstream infection.",
  "HAI2-VAP": "Ventilator-associated pneumonia.",
  "HAI2-CAUTI": "Catheter-associated urinary tract infection.",
  "HAI3": "Clostridioides difficile–associated diarrhoea (CDAD) (>48h post-admission or <30 days after discharge from previous admission).",
  "HAI4": "Other hospital-acquired infection of mixed or undefined origin (HAP, UTI, BSI).",
  "HAI4-BSI": "Bloodstream infection, not intervention-related.",
  "HAI4-HAP": "Non-intervention-related hospital-acquired pneumonia (not VAP).",
  "HAI4-UTI": "Urinary tract infection, not intervention-related.",
  "HAI5": "Patient readmitted <48h after staying in another hospital, with infection present on current admission or within 48 hours (infection likely from another hospital).",
  "HAI6": "Infection present on admission from long-term care facility (LTCF) or nursing home.",
  "SP": "Surgical prophylaxis category.", 
  "SP1": "Single dose.",
  "SP2": "One day.",
  "SP3": "More than 1 day.",
  "MP": "Medical prophylaxis. Examples: long-term use to prevent UTIs, antifungals in chemotherapy patients, penicillin prophylaxis in asplenia, etc.",
  "OTH": "Any other use. Example: erythromycin as a motility agent (motilin agonist).",
};

const DIAG_PRIMARY = ["Therapeutic", "Prophylaxis", "Neonates"];

const MISS_REASONS = [
  "Stock Out",
  "Patient Refused",
  "NPO",
  "IV Access Issue",
  "Patient out of ward",
  "Others (Specify)"
];

const RES_TYPES = [
  "ESBL", "CRE", "MRSA", "VRE", "MDR", "XDR", "PDR", "Carbapenemase-producing"
];

// --- HELPERS FOR eGFR CALCULATION ---
const calcCkdEpi2021 = (age: number, sex: string, scr: number) => {
  const k = sex === "Female" ? 0.7 : 0.9;
  const alpha = sex === "Female" ? -0.241 : -0.302;
  const minScr = Math.min(scr/k,1);
  const maxScr = Math.max(scr/k,1);

  return 142 *
    Math.pow(minScr,alpha) *
    Math.pow(maxScr,-1.2) *
    Math.pow(0.9938,age) *
    (sex === "Female" ? 1.012 : 1);
};

const calcCkidHeightBased = (ht: number, scr: number) => {
  return 0.413 * (ht / scr);
};

// --- TYPES ---
interface AntimicrobialEntry {
  id: number;
  class: string;
  drug: string;
  start: string;
  dose: string;
  unit: string;
  freq: string;
  perday: string;
  route: string;
  diagP: string;
  diagS: string;
  diagSub: string;
  indicationCategory: string;
  indicationSubCategory: string;
  indicationSpecificType: string;
  reason: string;
  guide: string;
  stop: string;
  miss: string;
  missWhy: string;
  treat: string;
  isOpen: boolean; 
}

interface MicroEntry {
  id: number;
  org: string;
  res: string;
  note: string;
}

interface AMSAuditFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AMSAudit | null;
}

const getIndicationDescription = (a: AntimicrobialEntry) => {
  if (a.diagSub && CODE_DESCRIPTIONS[a.diagSub]) {
    return CODE_DESCRIPTIONS[a.diagSub];
  }
  if (a.indicationSpecificType && CODE_DESCRIPTIONS[a.indicationSpecificType]) {
      return CODE_DESCRIPTIONS[a.indicationSpecificType];
  }
  if (a.indicationSubCategory && CODE_DESCRIPTIONS[a.indicationSubCategory]) {
      return CODE_DESCRIPTIONS[a.indicationSubCategory];
  }
  if (a.indicationCategory && CODE_DESCRIPTIONS[a.indicationCategory]) {
      return CODE_DESCRIPTIONS[a.indicationCategory];
  }
  return "";
};

// --- SUB-COMPONENTS ---
const FormGroup = ({ label, required, children, className = '', error }: { label: string, required?: boolean, children?: React.ReactNode, className?: string, error?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className={`text-xs font-bold text-gray-600 uppercase tracking-wide ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
  <input {...props} className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 transition-all [color-scheme:light] ${props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.className || ''}`} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) => (
  <select {...props} className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 transition-all [color-scheme:light] ${props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.className || ''}`} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) => (
  <textarea {...props} className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 transition-all [color-scheme:light] ${props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.className || ''}`} />
);

// Consistent Section Header
const FormSectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
    {icon}
    {title}
  </h2>
);

// --- GUIDE MODAL ---
interface DiagnosisGuideModalProps {
  onClose: () => void;
  onSelectCode: (diagP: string, diagS: string, diagSub: string) => void;
}

const DiagnosisGuideModal: React.FC<DiagnosisGuideModalProps> = ({ onClose, onSelectCode }) => {
  const allCodes = Object.entries(CODE_DESCRIPTIONS).filter(([code]) => 
    !INDICATION_CATEGORIES_OPTIONS.includes(code) &&
    !HAI_SUB_CATEGORIES_OPTIONS.includes(code) &&
    !HAI2_SPECIFIC_OPTIONS.includes(code) &&
    !SP_TYPES_OPTIONS.includes(code)
  );

  const handleSelect = (code: string) => {
    let diagP = "Therapeutic";
    let diagS = "";
    let diagSub = code;

    if (NEO_CODES.includes(code)) {
      diagP = "Neonates";
      diagS = "Neonatal";
    } else {
      for (const siteCategory of SITE_CATEGORIES) {
        if (THER_CODES[siteCategory]?.includes(code)) {
          diagS = siteCategory;
          if (PROPH_CODES[siteCategory]?.includes(code)) {
              diagP = "Prophylaxis";
          } else {
              diagP = "Therapeutic";
          }
          break;
        } else if (PROPH_CODES[siteCategory]?.includes(code)) { 
          diagS = siteCategory;
          diagP = "Prophylaxis";
          break;
        }
      }
      if (!diagS && SITE_CATEGORIES.includes("No defined site (NDS)")) {
          const ndsCodes = [...(THER_CODES["No defined site (NDS)"] || []), ...(PROPH_CODES["No defined site (NDS)"] || [])];
          if (ndsCodes.includes(code)) {
              diagS = "No defined site (NDS)";
              if (PROPH_CODES["No defined site (NDS)"]?.includes(code) && !THER_CODES["No defined site (NDS)"]?.includes(code)) {
                  diagP = "Prophylaxis";
              } else if (THER_CODES["No defined site (NDS)"]?.includes(code) && !PROPH_CODES["No defined site (NDS)"]?.includes(code)) {
                  diagP = "Therapeutic";
              } else {
                  diagP = "Therapeutic";
              }
          }
      }
    }
    
    if (!diagS) diagS = "No defined site (NDS)"; 
    if (code === "UNK" || code === "Other" || code === "MP-GEN" || code === "PROK") {
        if (PROPH_CODES["No defined site (NDS)"]?.includes(code)) {
            diagP = "Prophylaxis";
        } else {
            diagP = "Therapeutic";
        }
    }

    onSelectCode(diagP, diagS, diagSub);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Appendix II - Diagnostic Codes Guide</h3>
          <button onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="overflow-y-auto p-6">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2 font-bold text-gray-700">Site</th>
                <th className="border p-2 font-bold text-gray-700">Code</th>
                <th className="border p-2 font-bold text-gray-700">Description / Examples</th>
              </tr>
            </thead>
            <tbody>
              {allCodes.map(([code, desc]) => {
                const site = SITE_CATEGORIES.find(cat => THER_CODES[cat]?.includes(code) || PROPH_CODES[cat]?.includes(code)) || (NEO_CODES.includes(code) ? "Neonatal" : "No defined site (NDS)");
                
                return (
                  <tr 
                    key={code} 
                    className="border-b cursor-pointer hover:bg-green-50 transition-colors"
                    onClick={() => handleSelect(code)}
                  >
                    <td className="border p-2 font-semibold text-gray-600">{site}</td>
                    <td className="border p-2 font-bold text-green-700">{code}</td>
                    <td className="border p-2 text-gray-800">{desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


interface IndicationGuideModalProps {
  onClose: () => void;
  onSelectIndication: (category: string, subCategory: string, specificType: string) => void;
}

const IndicationGuideModal: React.FC<IndicationGuideModalProps> = ({ onClose, onSelectIndication }) => {

  const handleSelect = (category: string, subCategory: string = '', specificType: string = '') => {
    onSelectIndication(category, subCategory, specificType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Indication Type Guide</h3>
          <button onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="overflow-y-auto p-6">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2 font-bold text-gray-700">Category</th>
                <th className="border p-2 font-bold text-gray-700">Sub-category / Type</th>
                <th className="border p-2 font-bold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {INDICATION_CATEGORIES_OPTIONS.map(cat => (
                <React.Fragment key={cat}>
                  <tr 
                    className="border-b bg-gray-50 cursor-pointer hover:bg-green-50 transition-colors"
                    onClick={() => handleSelect(cat)}
                  >
                    <td className="border p-2 font-semibold text-green-700">{cat}</td>
                    <td className="border p-2 font-medium text-gray-600"></td>
                    <td className="border p-2 text-gray-800">{CODE_DESCRIPTIONS[cat]}</td>
                  </tr>
                  {cat === 'HAI' && HAI_SUB_CATEGORIES_OPTIONS.map(subCat => (
                    <React.Fragment key={subCat}>
                      <tr 
                        className="border-b cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleSelect(cat, subCat)}
                      >
                        <td className="border p-2"></td>
                        <td className="border p-2 font-bold text-blue-700">{subCat}</td>
                        <td className="border p-2 text-gray-800">{CODE_DESCRIPTIONS[subCat]}</td>
                      </tr>
                      {subCat === 'HAI2' && HAI2_SPECIFIC_OPTIONS.map(specType => (
                        <tr 
                          key={specType} 
                          className="border-b bg-blue-50/20 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSelect(cat, subCat, specType)}
                        >
                          <td className="border p-2"></td>
                          <td className="border p-2 pl-6 font-bold text-blue-600">{specType}</td>
                          <td className="border p-2 text-gray-800">{CODE_DESCRIPTIONS[specType]}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {cat === 'SP' && SP_TYPES_OPTIONS.map(spType => (
                    <tr 
                      key={spType} 
                      className="border-b cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => handleSelect(cat, spType)}
                    >
                      <td className="border p-2"></td>
                      <td className="border p-2 font-bold text-purple-700">{spType}</td>
                      <td className="border p-2 text-gray-800">{CODE_DESCRIPTIONS[spType]}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const AMSAuditForm: React.FC<AMSAuditFormProps> = ({ isOpen, onClose, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [showDiagnosisGuide, setShowDiagnosisGuide] = useState(false);
  const [showIndicationGuide, setShowIndicationGuide] = useState(false);
  const [showReview, setShowReview] = useState(false);
  
  // --- FORM STATE ---
  const [audit, setAudit] = useState({ 
    auditor: '', 
    auditorOther: '', 
    area: '', 
    areaOther: '', 
    date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })(), 
    shift: '' 
  });
  const [generalNote, setGeneralNote] = useState(''); // NEW GENERAL NOTE
  
  const [patientMode, setPatientMode] = useState<'adult' | 'pediatric'>('adult');
  const [patient, setPatient] = useState({ 
      hospNo: '', 
      dob: '', 
      ageString: '',
      sex: '', // Added Sex
      weight: '', 
      height: '',
      scr: '', 
      egfr: '' 
  });

  // Diagnostics
  const [dx, setDx] = useState({
    bioYN: 'No', bioType: '', bioTypeOther: '', bioFluid: '', bioFluidOther: '',
    cultDone: 'No', cultType: '', cultTypeOther: ''
  });

  // Antimicrobials (5 slots)
  const [abx, setAbx] = useState<AntimicrobialEntry[]>(
    Array.from({ length: 5 }).map((_, i) => ({
      id: i, class: '', drug: '', start: '', dose: '', unit: '', freq: '', perday: '', route: '',
      diagP: '', diagS: '', diagSub: '', 
      indicationCategory: '', indicationSubCategory: '', indicationSpecificType: '', 
      reason: '', guide: '', stop: '', miss: '', missWhy: '', treat: '',
      isOpen: i === 0 
    }))
  );
  const [activeAbxIndex, setActiveAbxIndex] = useState<number | null>(0); 

  // AI Guardrail States (Per drug index)
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, {
      renal?: { requiresAdjustment: boolean; recommendation: string },
      weight?: { status: 'SAFE' | 'WARNING'; message: string },
      pediatric?: { isSafe: boolean; message: string }
  }>>({});

  // Microorganisms - Dynamic
  const [isMicroCollapsed, setIsMicroCollapsed] = useState(true);
  const [micro, setMicro] = useState<MicroEntry[]>([]);
  const nextMicroId = useRef(0);

  // History
  const [hist, setHist] = useState({ prevHosp: '', prevAbx: '' });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // --- INITIALIZATION FOR EDIT MODE ---
  useEffect(() => {
    if (initialData) {
        // Map Auditor
        const isAuditorCustom = !AUDITORS.includes(initialData.auditor);
        setAudit({
            auditor: isAuditorCustom ? 'Others (Specify)' : initialData.auditor,
            auditorOther: isAuditorCustom ? initialData.auditor : '',
            area: AREAS.includes(initialData.area) ? initialData.area : 'Others (Specify)',
            areaOther: AREAS.includes(initialData.area) ? '' : initialData.area,
            date: initialData.audit_date,
            shift: initialData.shift
        });
        
        // Map General Note
        setGeneralNote(initialData.general_audit_note || '');

        // Map Patient
        // Check age string to auto-set patient mode if possible
        const isPediatric = initialData.patient_age_string?.includes('mo') || (parseInt(initialData.patient_age_string) < 19 && initialData.patient_age_string?.includes('yr'));
        setPatientMode(isPediatric ? 'pediatric' : 'adult');

        setPatient({
            hospNo: initialData.patient_hosp_no,
            dob: initialData.patient_dob,
            ageString: initialData.patient_age_string,
            // Extended fields (might be undefined if coming from old record)
            sex: (initialData.diagnostics as any)?.sex || '', // Load Sex
            weight: (initialData.diagnostics as any)?.weight || '',
            height: (initialData.diagnostics as any)?.height || '',
            scr: (initialData.diagnostics as any)?.scr || '',
            egfr: (initialData.diagnostics as any)?.egfr || ''
        });

        // Map Diagnostics
        setDx({
            bioYN: initialData.diagnostics.biomarkerUsed,
            bioType: initialData.diagnostics.biomarkerType || '',
            bioTypeOther: initialData.diagnostics.biomarkerTypeOther || '',
            bioFluid: initialData.diagnostics.fluidSample || '',
            bioFluidOther: initialData.diagnostics.fluidSampleOther || '',
            cultDone: initialData.diagnostics.cultureDone,
            cultType: initialData.diagnostics.cultureSpecimen || '',
            cultTypeOther: initialData.diagnostics.cultureSpecimenOther || ''
        });

        // Map History
        setHist({
            prevHosp: initialData.history.prevHosp3mo,
            prevAbx: initialData.history.prevAbx1mo
        });

        // Map Microorganisms
        const mappedMicro = (initialData.microorganisms || []).map((m: any, idx: number) => ({
            id: idx,
            org: m.organism,
            res: m.resistance,
            note: m.note
        }));
        setMicro(mappedMicro);
        nextMicroId.current = mappedMicro.length;

        // Map Antimicrobials (Fill up to 5 slots)
        const mappedAbx: AntimicrobialEntry[] = Array.from({ length: 5 }).map((_, i) => {
            const existing = initialData.antimicrobials && initialData.antimicrobials[i];
            if (existing) {
                return {
                    id: i,
                    class: existing.class,
                    drug: existing.drug,
                    start: existing.startDate,
                    dose: existing.unitDose?.toString() || '',
                    unit: existing.unit,
                    freq: existing.frequency || '',
                    perday: existing.dosesPerDay?.toString() || '',
                    route: existing.route,
                    diagP: existing.diagnosis,
                    diagS: (existing as any).systemSite || '', 
                    diagSub: (existing as any).subSite || '',
                    indicationCategory: existing.indicationCategory || '',
                    indicationSubCategory: existing.indicationSubCategory || '',
                    indicationSpecificType: existing.indicationSpecificType || '',
                    reason: existing.reasonInNote,
                    guide: existing.guidelinesCompliance,
                    stop: existing.stopReviewDocumented,
                    miss: existing.missedN?.toString() || '',
                    missWhy: existing.missedReason,
                    treat: existing.treatment,
                    isOpen: false
                };
            } else {
                 return {
                    id: i, class: '', drug: '', start: '', dose: '', unit: '', freq: '', perday: '', route: '',
                    diagP: '', diagS: '', diagSub: '', indicationCategory: '', indicationSubCategory: '', indicationSpecificType: '',
                    reason: '', guide: '', stop: '', miss: '', missWhy: '', treat: '',
                    isOpen: false
                 };
            }
        });
        if (mappedAbx.length > 0) mappedAbx[0].isOpen = true;
        setAbx(mappedAbx);
    }
  }, [initialData]);

  // --- CALCULATE AGE BASED ON AUDIT DATE ---
  useEffect(() => {
    if (patient.dob && audit.date) {
      const dobDate = new Date(patient.dob);
      const auditDate = new Date(audit.date);

      if (dobDate > auditDate) {
        setPatient(prev => ({ ...prev, ageString: "Invalid: DOB after Audit Date" }));
        return;
      }

      let years = auditDate.getFullYear() - dobDate.getFullYear();
      let months = auditDate.getMonth() - dobDate.getMonth();
      let days = auditDate.getDate() - dobDate.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(auditDate.getFullYear(), auditDate.getMonth(), 0);
        days += prevMonth.getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      const parts: string[] = [];
      if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
      if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
      if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

      setPatient(prev => ({ ...prev, ageString: parts.join(' ') }));
    } else {
      setPatient(prev => ({ ...prev, ageString: '' }));
    }
  }, [patient.dob, audit.date]);

  // --- AUTO CALCULATE eGFR ---
  useEffect(() => {
    // Requires: Age, Sex, SCr (Adult) OR Height, SCr (Pediatric)
    if (!patient.scr) {
      // If SCr is cleared, clear eGFR
      if (patient.egfr && patient.egfr !== '—' && patient.egfr !== 'Pending') {
         setPatient(prev => ({...prev, egfr: ''}));
      }
      return;
    }

    let egfrText = '—';
    const scrNum = parseFloat(patient.scr);
    
    // Check if valid SCr
    if (isNaN(scrNum) || scrNum <= 0) {
       setPatient(prev => ({...prev, egfr: ''}));
       return;
    }
    
    // Convert µmol/L to mg/dL for calculation
    const scrMgDl = scrNum / 88.4; 

    if (patientMode === 'adult') {
        // Need Age and Sex
        if (patient.dob && audit.date && patient.sex) {
             const dobDate = new Date(patient.dob);
             const auditDate = new Date(audit.date);
             let ageYears = auditDate.getFullYear() - dobDate.getFullYear();
             const m = auditDate.getMonth() - dobDate.getMonth();
             if (m < 0 || (m === 0 && auditDate.getDate() < dobDate.getDate())) {
                 ageYears--;
             }

             if (ageYears >= 0) {
                 const egfr = calcCkdEpi2021(ageYears, patient.sex, scrMgDl);
                 egfrText = isFinite(egfr) ? egfr.toFixed(1) + ' mL/min/1.73m²' : '—';
             }
        }
    } else {
        // Pediatric: Needs Height (cm)
        const htNum = parseFloat(patient.height);
        if (!isNaN(htNum) && htNum > 0) {
             const egfr = calcCkidHeightBased(htNum, scrMgDl);
             egfrText = isFinite(egfr) ? egfr.toFixed(1) + ' mL/min/1.73m²' : '—';
        } else {
             egfrText = 'Enter Height';
        }
    }

    setPatient(prev => ({...prev, egfr: egfrText}));

  }, [patient.scr, patient.height, patient.sex, patient.dob, audit.date, patientMode]);


  // --- AI GUARDRAIL TRIGGERS ---
  useEffect(() => {
      if (activeAbxIndex === null) return;
      const idx = activeAbxIndex; // Guardrail index for async closure
      const currentDrug = abx[idx];
      if (!currentDrug.drug) return;

      const runChecks = async () => {
          let results: any = { ...aiAnalysis[idx] };
          let hasChanges = false;

          // 1. Renal Check
          const monograph = patientMode === 'adult' ? ADULT_MONOGRAPHS[currentDrug.drug] : PEDIATRIC_MONOGRAPHS[currentDrug.drug];
          if (patient.egfr && monograph?.renal) {
              const renalRes = await checkRenalDosing(currentDrug.drug, patient.egfr, monograph.renal);
              if (renalRes) {
                  results.renal = renalRes;
                  hasChanges = true;
              }
          }

          // 2. Weight-Based & Pediatric Check
          if (patient.weight && currentDrug.dose) {
              if (patientMode === 'pediatric') {
                  const pediaRes = await verifyPediatricDosing(currentDrug.drug, patient.weight, patient.ageString, currentDrug.dose, currentDrug.freq, PEDIATRIC_MONOGRAPHS[currentDrug.drug]?.dosing || '');
                  if (pediaRes) {
                      results.pediatric = pediaRes;
                      hasChanges = true;
                  }
              } else {
                   // Adult Weight Check (for specific drugs)
                   if (monograph?.weightBased) {
                       const weightRes = await verifyWeightBasedDosing('adult', currentDrug.drug, patient.weight, currentDrug.dose, currentDrug.freq, monograph.dosing);
                       if (weightRes) {
                           results.weight = weightRes;
                           hasChanges = true;
                       }
                   }
              }
          }

          if (hasChanges) {
              setAiAnalysis(prev => ({ ...prev, [idx]: results }));
          }
      };

      // Debounce logic
      const timer = setTimeout(() => {
          runChecks();
      }, 1500);
      return () => clearTimeout(timer);
  }, [
      activeAbxIndex, 
      activeAbxIndex !== null ? abx[activeAbxIndex]?.drug : undefined, 
      activeAbxIndex !== null ? abx[activeAbxIndex]?.dose : undefined, 
      activeAbxIndex !== null ? abx[activeAbxIndex]?.freq : undefined, 
      patient.egfr, 
      patient.weight, 
      patientMode
  ]);


  // --- HANDLERS ---
  const handleAuditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAudit(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => {
        const { [name]: removed, ...rest } = prev;
        return rest;
    });
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => {
        const { [`patient_${name}`]: removed, ...rest } = prev;
        return rest;
    });
  };

  const handleDxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDx(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => {
        const { [`dx_${name}`]: removed, ...rest } = prev;
        return rest;
    });
  };

  const handleHistChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHist(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => {
        const { [`hist_${name}`]: removed, ...rest } = prev;
        return rest;
    });
  };

  const updateAbx = (index: number, field: keyof AntimicrobialEntry, value: any) => {
    setAbx(prev => prev.map((item, i) => {
      if (i !== index) return item;

      let updated = { ...item, [field]: value };

      // Logic: Frequency auto-calc
      if (field === 'freq') {
        const freqVal = parseFloat(value);
        if (!isNaN(freqVal) && freqVal > 0) {
            updated.perday = (24 / freqVal).toString();
        } else if (value === '') {
            updated.perday = '';
        }
      }

      // Logic: Clear Dependent Fields for Diagnosis
      if (field === 'class') updated.drug = '';
      if (field === 'diagP') { updated.diagS = ''; updated.diagSub = ''; }
      if (field === 'diagS') updated.diagSub = '';
      
      // Logic: Clear Dependent Fields for Indication
      if (field === 'indicationCategory') {
        updated.indicationSubCategory = '';
        updated.indicationSpecificType = '';
      }
      if (field === 'indicationSubCategory') {
        updated.indicationSpecificType = '';
      }

      if (field === 'miss' && (Number(value) <= 0 || value === '')) updated.missWhy = '';

      return updated;
    }));
    setValidationErrors(prev => {
        const { [`abx_${index}_${String(field)}`]: removed, ...rest } = prev;
        return rest;
    });
  };

  const toggleAbxAccordion = (index: number) => {
    setAbx(prev => prev.map((item, i) => i === index ? { ...item, isOpen: !item.isOpen } : item));
    setActiveAbxIndex(index); 
  };

  const addMicroorganism = () => {
    setMicro(prev => [...prev, { id: nextMicroId.current++, org: '', res: '', note: '' }]);
    setIsMicroCollapsed(false);
  };

  const removeMicroorganism = (id: number) => {
    setMicro(prev => prev.filter(m => m.id !== id));
  };

  const updateMicroorganism = (id: number, field: keyof MicroEntry, value: string) => {
    setMicro(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // --- Callbacks for Guide Modals ---
  const handleSelectDiagnosisCode = (diagP: string, diagS: string, diagSub: string) => {
    if (activeAbxIndex !== null) {
      setAbx(prev => prev.map((item, i) => {
        if (i === activeAbxIndex) {
          return {
            ...item,
            diagP,
            diagS,
            diagSub,
          };
        }
        return item;
      }));
       setValidationErrors(prev => {
        const { [`abx_${activeAbxIndex}_diagP`]: p, [`abx_${activeAbxIndex}_diagS`]: s, [`abx_${activeAbxIndex}_diagSub`]: sub, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSelectIndication = (category: string, subCategory: string, specificType: string) => {
    if (activeAbxIndex !== null) {
      setAbx(prev => prev.map((item, i) => {
        if (i === activeAbxIndex) {
          return {
            ...item,
            indicationCategory: category,
            indicationSubCategory: subCategory,
            indicationSpecificType: specificType,
          };
        }
        return item;
      }));
       setValidationErrors(prev => {
        const { [`abx_${activeAbxIndex}_indicationCategory`]: c, [`abx_${activeAbxIndex}_indicationSubCategory`]: sc, [`abx_${activeAbxIndex}_indicationSpecificType`]: st, ...rest } = prev;
        return rest;
      });
    }
  };


  // --- VALIDATION & SUBMIT ---
  const validate = () => {
    const errors: Record<string, string> = {};

    if (!audit.auditor) errors.auditor = "Auditor is required.";
    if (audit.auditor === 'Others (Specify)' && !audit.auditorOther) errors.auditorOther = "Specify Auditor name.";
    if (!audit.area) errors.area = "Ward/Area is required.";
    if (audit.area === 'Others (Specify)' && !audit.areaOther) errors.areaOther = "Specify Ward/Area.";
    if (!audit.date) errors.date = "Date is required.";
    if (!audit.shift) errors.shift = "Shift is required.";
    if (!patient.hospNo) errors.patient_hospNo = "Hospital Number is required.";
    if (!patient.dob) errors.patient_dob = "Date of Birth is required.";
    if (!patient.sex) errors.patient_sex = "Patient sex is required.";
    if (!patient.weight) errors.patient_weight = "Patient weight is required.";
    if (patientMode === 'pediatric' && !patient.height) errors.patient_height = "Patient height is required for pediatric eGFR.";
    if (!patient.scr) errors.patient_scr = "Patient SCr is required.";


    if (dx.bioYN === 'Yes' && !dx.bioType) errors.dx_bioType = "Specify biomarker type.";
    if (dx.bioYN === 'Yes' && dx.bioType === 'Others' && !dx.bioTypeOther) errors.dx_bioTypeOther = "Specify Other biomarker type.";
    if (dx.bioYN === 'Yes' && !dx.bioFluid) errors.dx_bioFluid = "Specify biological sample.";
    if (dx.bioYN === 'Yes' && dx.bioFluid === 'Others' && !dx.bioFluidOther) errors.dx_bioFluidOther = "Specify Other fluid sample.";
    if (dx.cultDone === 'Yes' && !dx.cultType) errors.dx_cultType = "Select culture specimen type.";
    if (dx.cultDone === 'Yes' && dx.cultType === 'Other' && !dx.cultTypeOther) errors.dx_cultTypeOther = "Specify Other culture specimen.";

    const activeAbx = abx.filter(a => a.drug || a.start || a.dose);
    if (activeAbx.length === 0) {
        errors.noAntimicrobials = "Enter at least one antimicrobial.";
    }

    for (let i = 0; i < activeAbx.length; i++) {
      const a = activeAbx[i];
      const num = a.id + 1;
      if (!a.class) errors[`abx_${a.id}_class`] = `Antimicrobial ${num}: Select Monitored/Restricted.`;
      if (!a.drug) errors[`abx_${a.id}_drug`] = `Antimicrobial ${num}: Select Drug.`;
      if (!a.start) errors[`abx_${a.id}_start`] = `Antimicrobial ${num}: Start Date required.`;
      if (!a.dose || Number(a.dose) <= 0) errors[`abx_${a.id}_dose`] = `Antimicrobial ${num}: Invalid dose.`;
      if (!a.unit) errors[`abx_${a.id}_unit`] = `Antimicrobial ${num}: Unit required.`;
      if (!a.perday) errors[`abx_${a.id}_perday`] = `Antimicrobial ${num}: Doses/day required.`;
      if (!a.route) errors[`abx_${a.id}_route`] = `Antimicrobial ${num}: Route required.`;
      if (!a.diagP) errors[`abx_${a.id}_diagP`] = `Antimicrobial ${num}: Diagnosis Type required.`;
      if ((a.diagP === 'Therapeutic' || a.diagP === 'Prophylaxis') && !a.diagS) errors[`abx_${a.id}_diagS`] = `Antimicrobial ${num}: System/Site required.`;
      if ((a.diagP === 'Therapeutic' || a.diagP === 'Prophylaxis') && !a.diagSub && THER_CODES[a.diagS]?.length > 0 && !PROPH_CODES[a.diagS]?.includes(a.diagSub) ) errors[`abx_${a.id}_diagSub`] = `Antimicrobial ${num}: Sub-site required.`; 
      if (a.diagP === 'Neonates' && !a.diagSub) errors[`abx_${a.id}_diagSub`] = `Antimicrobial ${num}: Neonatal code required.`;
      
      if (!a.indicationCategory) errors[`abx_${a.id}_indicationCategory`] = `Antimicrobial ${num}: Indication Category required.`;
      if ((a.indicationCategory === 'HAI' || a.indicationCategory === 'SP') && !a.indicationSubCategory) errors[`abx_${a.id}_indicationSubCategory`] = `Antimicrobial ${num}: Indication Sub-category required.`;
      if (a.indicationCategory === 'HAI' && a.indicationSubCategory === 'HAI2' && !a.indicationSpecificType) errors[`abx_${a.id}_indicationSpecificType`] = `Antimicrobial ${num}: Indication Specific Type for HAI2 required.`;

      if (!a.reason) errors[`abx_${a.id}_reason`] = `Antimicrobial ${num}: Reason in note required.`;
      if (!a.guide) errors[`abx_${a.id}_guide`] = `Antimicrobial ${num}: Guidelines Compliance required.`;
      if (!a.treat) errors[`abx_${a.id}_treat`] = `Antimicrobial ${num}: Treatment type required.`;
      if (Number(a.miss) > 0 && !a.missWhy) errors[`abx_${a.id}_missWhy`] = `Antimicrobial ${num}: Missed dose reason required.`;
    }

    if (!hist.prevHosp) errors.hist_prevHosp = "Previous Hospitalization history required.";
    if (!hist.prevAbx) errors.hist_prevAbx = "Previous Antibiotic history required.";

    return errors;
  };

  const prepareAuditData = () => {
    const activeAbx = abx.filter(a => a.drug || a.start || a.dose).map(a => ({
      class: a.class,
      drug: a.drug,
      startDate: a.start,
      unitDose: Number(a.dose),
      unit: a.unit,
      frequency: a.freq, 
      dosesPerDay: Number(a.perday),
      route: a.route,
      diagnosis: a.diagP,
      systemSite: a.diagS || "",
      subSite: a.diagSub || "",
      indicationCategory: a.indicationCategory,
      indicationSubCategory: a.indicationSubCategory || "",
      indicationSpecificType: a.indicationSpecificType || "",
      reasonInNote: a.reason,
      guidelinesCompliance: a.guide,
      stopReviewDocumented: a.stop,
      missedN: Number(a.miss) || 0,
      missedReason: a.missWhy || "",
      treatment: a.treat
    }));

    const activeMicro = micro.filter(m => m.org || m.res || m.note).map(m => ({
      organism: m.org.trim(),
      resistance: m.res,
      note: m.note.trim()
    }));

    const finalAuditor = audit.auditor === 'Others (Specify)' ? audit.auditorOther : audit.auditor;
    const finalArea = audit.area === 'Others (Specify)' ? audit.areaOther : audit.area;

    const data: Partial<AMSAudit> = {
      audit_date: audit.date,
      auditor: finalAuditor,
      area: finalArea,
      shift: audit.shift,
      patient_hosp_no: patient.hospNo,
      patient_dob: patient.dob,
      patient_age_string: patient.ageString,
      general_audit_note: generalNote, // NEW
      diagnostics: {
        biomarkerUsed: dx.bioYN,
        biomarkerType: dx.bioType,
        fluidSample: dx.bioFluid,
        biomarkerTypeOther: dx.bioType === 'Others' ? dx.bioTypeOther : "",
        fluidSampleOther: dx.bioFluid === 'Others' ? dx.bioFluidOther : "",
        cultureDone: dx.cultDone,
        cultureSpecimen: dx.cultType,
        cultureSpecimenOther: dx.cultType === 'Other' ? dx.cultTypeOther : "",
        // Save new fields
        sex: patient.sex, // Added Sex
        weight: patient.weight,
        height: patient.height,
        scr: patient.scr,
        egfr: patient.egfr
      },
      history: {
        prevHosp3mo: hist.prevHosp,
        prevAbx1mo: hist.prevAbx
      },
      antimicrobials: activeAbx,
      microorganisms: activeMicro,
      created_at: initialData ? initialData.created_at : new Date().toISOString()
    };
    return data;
  };

  const handleInitialSubmit = () => {
    const errors = validate();
    // AMS can save even leaving mandatory field empty
    setValidationErrors(errors);
    setShowReview(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    const newAudit = prepareAuditData();

    try {
      if (initialData && initialData.id) {
         await updateAudit(initialData.id, newAudit);
         alert("Audit Log Updated Successfully.");
      } else {
         await createAudit(newAudit);
         alert("Audit Log Created Successfully.");
      }
      setShowReview(false);
      onClose();
    } catch (e: any) {
      console.error("Submission error", e);
      alert("Submission failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showDiagnosisGuide && <DiagnosisGuideModal onClose={() => setShowDiagnosisGuide(false)} onSelectCode={handleSelectDiagnosisCode} />}
      {showIndicationGuide && <IndicationGuideModal onClose={() => setShowIndicationGuide(false)} onSelectIndication={handleSelectIndication} />}
      
      {/* Review Modal - Matched to Detail Modal Style */}
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-gray-200">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex justify-between items-center text-white shadow-md">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Confirm Audit Submission
                    </h3>
                    <button onClick={() => setShowReview(false)} className="bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <AMSAuditSummary data={prepareAuditData()} />
                </div>

                <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                    <button onClick={() => setShowReview(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Edit</button>
                    <button onClick={handleFinalSubmit} disabled={loading} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm hover:shadow-lg transition-all flex items-center gap-2">
                        {loading ? 'Submitting...' : (initialData ? 'Update Audit Log' : 'Confirm Submission')}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <header className="flex items-center justify-between gap-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-4 sticky top-0 z-10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 className="text-xl font-bold">{initialData ? 'Edit Audit Log' : 'AMS Audit Form'}</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </header>

          {/* Form Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* AUDIT CONTEXT */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <FormSectionHeader title="Audit Context" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormGroup label="Auditor" required error={validationErrors.auditor}>
                  <Select name="auditor" value={audit.auditor} onChange={handleAuditChange} error={validationErrors.auditor}>
                    <option value="">Select</option>
                    {AUDITORS.map(a => <option key={a} value={a}>{a}</option>)}
                    <option value="Others (Specify)">Others (Specify)</option>
                  </Select>
                  {audit.auditor === 'Others (Specify)' && <Input name="auditorOther" placeholder="Auditor Name" value={audit.auditorOther} onChange={handleAuditChange} error={validationErrors.auditorOther} className="mt-2" />}
                </FormGroup>
                <FormGroup label="Ward / Area" required error={validationErrors.area}>
                  <Select name="area" value={audit.area} onChange={handleAuditChange} error={validationErrors.area}>
                    <option value="">Select</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </Select>
                  {audit.area === 'Others (Specify)' && <Input name="areaOther" placeholder="Ward Name" value={audit.areaOther} onChange={handleAuditChange} error={validationErrors.areaOther} className="mt-2" />}
                </FormGroup>
                <FormGroup label="Date" required error={validationErrors.date}><Input type="date" name="date" value={audit.date} onChange={handleAuditChange} error={validationErrors.date} /></FormGroup>
                <FormGroup label="Shift" required error={validationErrors.shift}>
                  <Select name="shift" value={audit.shift} onChange={handleAuditChange} error={validationErrors.shift}>
                    <option value="">Select</option>
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </FormGroup>
              </div>
            </div>

            {/* PATIENT DETAILS */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</h2>
                    <div className="inline-flex rounded-full border border-gray-300 bg-white shadow-sm">
                        <button type="button" className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${patientMode === 'adult' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setPatientMode('adult')}>Adult</button>
                        <button type="button" className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${patientMode === 'pediatric' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setPatientMode('pediatric')}>Pediatric</button>
                    </div>
                </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormGroup label="Hospital No." required error={validationErrors.patient_hospNo}><Input name="hospNo" value={patient.hospNo} onChange={handlePatientChange} error={validationErrors.patient_hospNo} /></FormGroup>
                <FormGroup label="Date of Birth" required error={validationErrors.patient_dob}><Input type="date" name="dob" value={patient.dob} onChange={handlePatientChange} error={validationErrors.patient_dob} /></FormGroup>
                <FormGroup label="Calculated Age"><div className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-700">{patient.ageString || '—'}</div></FormGroup>
                <FormGroup label="Sex" required error={validationErrors.patient_sex}>
                    <Select name="sex" value={patient.sex} onChange={handlePatientChange} error={validationErrors.patient_sex}>
                        <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                    </Select>
                </FormGroup>
                <FormGroup label="Weight (kg)" required error={validationErrors.patient_weight}><Input type="number" name="weight" value={patient.weight} onChange={handlePatientChange} error={validationErrors.patient_weight} /></FormGroup>
                <FormGroup label="Height (cm)" required={patientMode === 'pediatric'} error={validationErrors.patient_height}><Input type="number" name="height" value={patient.height} onChange={handlePatientChange} error={validationErrors.patient_height} /></FormGroup>
                <FormGroup label="SCr (µmol/L)" required error={validationErrors.patient_scr}><Input type="number" name="scr" value={patient.scr} onChange={handlePatientChange} error={validationErrors.patient_scr} /></FormGroup>
                <FormGroup label="eGFR"><div className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-700">{patient.egfr || '—'}</div></FormGroup>
              </div>
            </div>

            {/* DIAGNOSTICS & HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <FormSectionHeader title="Diagnostics" />
                    <div className="space-y-4">
                        <FormGroup label="Biomarkers Used?">
                            <Select name="bioYN" value={dx.bioYN} onChange={handleDxChange}>
                                <option value="No">No</option><option value="Yes">Yes</option>
                            </Select>
                        </FormGroup>
                        {dx.bioYN === 'Yes' && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <FormGroup label="Biomarker" required error={validationErrors.dx_bioType}><Select name="bioType" value={dx.bioType} onChange={handleDxChange} error={validationErrors.dx_bioType}><option value="">Select</option><option value="PCT">PCT</option><option value="CRP">CRP</option><option value="Others">Others</option></Select>{dx.bioType === 'Others' && <Input name="bioTypeOther" value={dx.bioTypeOther} onChange={handleDxChange} error={validationErrors.dx_bioTypeOther} className="mt-2" />}</FormGroup>
                                <FormGroup label="Biological Sample" required error={validationErrors.dx_bioFluid}><Select name="bioFluid" value={dx.bioFluid} onChange={handleDxChange} error={validationErrors.dx_bioFluid}><option value="">Select</option><option value="Blood">Blood</option><option value="CSF">CSF</option><option value="Others">Others</option></Select>{dx.bioFluid === 'Others' && <Input name="bioFluidOther" value={dx.bioFluidOther} onChange={handleDxChange} error={validationErrors.dx_bioFluidOther} className="mt-2" />}</FormGroup>
                            </div>
                        )}
                        <FormGroup label="Culture Done?">
                            <Select name="cultDone" value={dx.cultDone} onChange={handleDxChange}>
                                <option value="No">No</option><option value="Yes">Yes</option>
                            </Select>
                        </FormGroup>
                        {dx.cultDone === 'Yes' && (
                             <div className="grid grid-cols-1 gap-4 border-t pt-4">
                                <FormGroup label="Specimen" required error={validationErrors.dx_cultType}><Select name="cultType" value={dx.cultType} onChange={handleDxChange} error={validationErrors.dx_cultType}><option value="">Select</option><option value="Blood">Blood</option><option value="Sputum">Sputum</option><option value="Stool">Stool</option><option value="Urine">Urine</option><option value="Other">Other</option></Select>{dx.cultType === 'Other' && <Input name="cultTypeOther" value={dx.cultTypeOther} onChange={handleDxChange} error={validationErrors.dx_cultTypeOther} className="mt-2" />}</FormGroup>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <FormSectionHeader title="Patient History" />
                    <div className="space-y-4">
                        <FormGroup label="Prev Hospitalization (3 mo)?" required error={validationErrors.hist_prevHosp}>
                            <Select name="prevHosp" value={hist.prevHosp} onChange={handleHistChange} error={validationErrors.hist_prevHosp}><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option><option value="Unknown">Unknown</option></Select>
                        </FormGroup>
                        <FormGroup label="Prev Antibiotics (1 mo)?" required error={validationErrors.hist_prevAbx}>
                            <Select name="prevAbx" value={hist.prevAbx} onChange={handleHistChange} error={validationErrors.hist_prevAbx}><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option><option value="Unknown">Unknown</option></Select>
                        </FormGroup>
                    </div>
                </div>
            </div>

            {/* ANTIMICROBIALS */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <FormSectionHeader title="Antimicrobials Prescribed" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} />
                {validationErrors.noAntimicrobials && <p className="text-red-500 text-xs mb-4">{validationErrors.noAntimicrobials}</p>}
                
                <div className="space-y-4">
                {abx.map((a, i) => (
                    <div key={a.id} className={`rounded-xl border transition-all ${a.isOpen ? 'bg-blue-50/30 border-blue-200 shadow-lg' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex justify-between items-center p-3 cursor-pointer select-none" onClick={() => toggleAbxAccordion(i)}>
                            <span className="font-bold text-gray-800">Antimicrobial #{i + 1} {a.drug && `- ${a.drug}`}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform ${a.isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>

                        {a.isOpen && (
                        <div className="p-4 border-t border-gray-200 space-y-6 animate-fade-in">
                            {/* DRUG SELECTION */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormGroup label="Monitored / Restricted" required error={validationErrors[`abx_${i}_class`]}><Select name="class" value={a.class} onChange={e => updateAbx(i, 'class', e.target.value)} error={validationErrors[`abx_${i}_class`]}><option value="">Select</option><option value="Monitored">Monitored</option><option value="Restricted">Restricted</option></Select></FormGroup>
                                <FormGroup label="Drug Name" required className="col-span-2" error={validationErrors[`abx_${i}_drug`]}><Select name="drug" value={a.drug} onChange={e => updateAbx(i, 'drug', e.target.value)} error={validationErrors[`abx_${i}_drug`]}><option value="">Select Drug</option>{(a.class === 'Monitored' ? MONITORED_DRUGS : RESTRICTED_DRUGS).map(d => <option key={d} value={d}>{d}</option>)}</Select></FormGroup>
                                <FormGroup label="Start Date" required error={validationErrors[`abx_${i}_start`]}><Input type="date" name="start" value={a.start} onChange={e => updateAbx(i, 'start', e.target.value)} error={validationErrors[`abx_${i}_start`]} /></FormGroup>
                            </div>

                            {/* DOSE & ROUTE */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <FormGroup label="Unit Dose" required error={validationErrors[`abx_${i}_dose`]}><Input type="number" min="0" name="dose" value={a.dose} onChange={e => updateAbx(i, 'dose', e.target.value)} error={validationErrors[`abx_${i}_dose`]} /></FormGroup>
                                <FormGroup label="Unit" required error={validationErrors[`abx_${i}_unit`]}><Select name="unit" value={a.unit} onChange={e => updateAbx(i, 'unit', e.target.value)} error={validationErrors[`abx_${i}_unit`]}><option value="">Select</option><option value="g">g</option><option value="mg">mg</option><option value="mcg">mcg</option><option value="iu">IU</option></Select></FormGroup>
                                <FormGroup label="Route" required error={validationErrors[`abx_${i}_route`]}><Select name="route" value={a.route} onChange={e => updateAbx(i, 'route', e.target.value)} error={validationErrors[`abx_${i}_route`]}><option value="">Select</option><option value="PO">PO</option><option value="IV">IV</option><option value="IM">IM</option><option value="Other">Other</option></Select></FormGroup>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <FormGroup label="Frequency (q_h)"><Input type="number" min="1" max="48" name="freq" value={a.freq} onChange={e => updateAbx(i, 'freq', e.target.value)} placeholder="e.g. 8" /></FormGroup>
                                    <FormGroup label="Doses/Day" required error={validationErrors[`abx_${i}_perday`]}><Input type="number" min="1" max="24" name="perday" value={a.perday} onChange={e => updateAbx(i, 'perday', e.target.value)} placeholder="e.g. 3" error={validationErrors[`abx_${i}_perday`]} /></FormGroup>
                            </div>

                            {/* AI BANNERS */}
                            <div className="space-y-2">
                                {aiAnalysis[i]?.renal && <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-yellow-800 text-xs rounded shadow-sm"><span className="font-bold">RENAL ALERT:</span> {aiAnalysis[i]?.renal?.recommendation}</div>}
                                {aiAnalysis[i]?.weight && <div className={`border-l-4 p-3 text-xs rounded shadow-sm ${aiAnalysis[i]?.weight?.status === 'SAFE' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-orange-50 border-orange-400 text-orange-800'}`}><span className="font-bold">WEIGHT DOSE:</span> {aiAnalysis[i]?.weight?.message}</div>}
                                {aiAnalysis[i]?.pediatric && <div className={`border-l-4 p-3 text-xs rounded shadow-sm ${aiAnalysis[i]?.pediatric?.isSafe ? 'bg-green-50 border-green-400 text-green-800' : 'bg-orange-50 border-orange-400 text-orange-800'}`}><span className="font-bold">PEDIATRIC DOSE:</span> {aiAnalysis[i]?.pediatric?.message}</div>}
                            </div>


                            {/* DIAGNOSIS */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-sm">Diagnosis</h4><button type="button" onClick={() => { setActiveAbxIndex(i); setShowDiagnosisGuide(true); }} className="text-xs font-bold text-blue-600 hover:underline">Code Guide</button></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormGroup label="Primary" required error={validationErrors[`abx_${i}_diagP`]}><Select name="diagP" value={a.diagP} onChange={e => updateAbx(i, 'diagP', e.target.value)} error={validationErrors[`abx_${i}_diagP`]}><option value="">Select</option>{DIAG_PRIMARY.map(c => <option key={c} value={c}>{c}</option>)}</Select></FormGroup>
                                    <FormGroup label="System / Site" required={(a.diagP === 'Therapeutic' || a.diagP === 'Prophylaxis')} error={validationErrors[`abx_${i}_diagS`]}><Select name="diagS" value={a.diagS} onChange={e => updateAbx(i, 'diagS', e.target.value)} error={validationErrors[`abx_${i}_diagS`]} disabled={!a.diagP || a.diagP === 'Neonates'}><option value="">Select</option>{SITE_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}</Select></FormGroup>
                                    <FormGroup label="Sub-site / Code" required={((a.diagP === 'Therapeutic' || a.diagP === 'Prophylaxis') && !!a.diagS)} error={validationErrors[`abx_${i}_diagSub`]}>
                                        <input readOnly onClick={() => { setActiveAbxIndex(i); setShowDiagnosisGuide(true); }} value={a.diagSub} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100" placeholder="Click Code Guide" />
                                    </FormGroup>
                                </div>
                            </div>

                            {/* INDICATION */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-sm">Indication</h4><button type="button" onClick={() => { setActiveAbxIndex(i); setShowIndicationGuide(true); }} className="text-xs font-bold text-blue-600 hover:underline">Type Guide</button></div>
                                <div className="grid grid-cols-1 gap-2">
                                    <input readOnly onClick={() => { setActiveAbxIndex(i); setShowIndicationGuide(true); }} value={`${a.indicationCategory ? a.indicationCategory : ''}${a.indicationSubCategory ? ' > ' + a.indicationSubCategory : ''}${a.indicationSpecificType ? ' > ' + a.indicationSpecificType : ''}`} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100" placeholder="Click Type Guide to Select Indication" />
                                    {getIndicationDescription(a) && <p className="text-xs text-gray-500 italic mt-1">{getIndicationDescription(a)}</p>}
                                    {validationErrors[`abx_${i}_indicationCategory`] && <p className="text-red-500 text-xs">{validationErrors[`abx_${i}_indicationCategory`]}</p>}
                                </div>
                            </div>

                            {/* COMPLIANCE & REASONS */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormGroup label="Reason in Note?" required error={validationErrors[`abx_${i}_reason`]}><Select name="reason" value={a.reason} onChange={e => updateAbx(i, 'reason', e.target.value)} error={validationErrors[`abx_${i}_reason`]}><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></Select></FormGroup>
                                <FormGroup label="Guidelines Compliant?" required error={validationErrors[`abx_${i}_guide`]}><Select name="guide" value={a.guide} onChange={e => updateAbx(i, 'guide', e.target.value)} error={validationErrors[`abx_${i}_guide`]}><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></Select></FormGroup>
                                <FormGroup label="Stop/Review Date Documented?"><Select name="stop" value={a.stop} onChange={e => updateAbx(i, 'stop', e.target.value)}><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></Select></FormGroup>
                                <FormGroup label="Treatment" required error={validationErrors[`abx_${i}_treat`]}><Select name="treat" value={a.treat} onChange={e => updateAbx(i, 'treat', e.target.value)} error={validationErrors[`abx_${i}_treat`]}><option value="">Select</option><option value="Empiric">Empiric</option><option value="Targeted">Targeted</option></Select></FormGroup>
                            </div>

                            {/* MISSED DOSES */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                <FormGroup label="Missed Doses (N)"><Input type="number" min="0" name="miss" value={a.miss} onChange={e => updateAbx(i, 'miss', e.target.value)} /></FormGroup>
                                {Number(a.miss) > 0 && <FormGroup label="Reason for Missed Dose" required error={validationErrors[`abx_${i}_missWhy`]}><Select name="missWhy" value={a.missWhy} onChange={e => updateAbx(i, 'missWhy', e.target.value)} error={validationErrors[`abx_${i}_missWhy`]}><option value="">Select</option>{MISS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</Select></FormGroup>}
                            </div>
                        </div>
                        )}
                    </div>
                ))}
                </div>
            </div>

            {/* MICROBIOLOGY */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l4-2 4 2 4-2 4 2V4a2 2 0 00-2-2H5zm0 2h10v12.382l-3-1.5-2 1-2-1-3 1.5V4z" clipRule="evenodd" /></svg>
                        Microbiology
                    </h2>
                    <button type="button" onClick={addMicroorganism} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">+ Add Organism</button>
                </div>
                
                {!isMicroCollapsed && (
                    <div className="space-y-3 animate-fade-in">
                        {micro.map((m, i) => (
                            <div key={m.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <FormGroup label="Organism"><Input placeholder="e.g. E. coli" value={m.org} onChange={e => updateMicroorganism(m.id, 'org', e.target.value)} /></FormGroup>
                                <FormGroup label="Resistance">
                                    <Select value={m.res} onChange={e => updateMicroorganism(m.id, 'res', e.target.value)}>
                                        <option value="">None / Sensitive</option>
                                        {RES_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </Select>
                                </FormGroup>
                                <div className="flex gap-2">
                                    <FormGroup label="Note" className="flex-grow"><Input placeholder="Optional details..." value={m.note} onChange={e => updateMicroorganism(m.id, 'note', e.target.value)} /></FormGroup>
                                    <button onClick={() => removeMicroorganism(m.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {micro.length === 0 && <p className="text-sm text-gray-400 italic">No organisms recorded.</p>}
            </div>

            {/* GENERAL AUDIT NOTES */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <FormSectionHeader title="General Audit Notes" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} />
                <Textarea 
                    rows={3} 
                    placeholder="Enter high-level summary, recommendations, or general observations for this audit case..."
                    value={generalNote}
                    onChange={(e) => setGeneralNote(e.target.value)}
                />
            </div>

          </div>

          {/* Footer */}
          <footer className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold border border-gray-300 transition-colors">Cancel</button>
            <button onClick={handleInitialSubmit} className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                Review Audit
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default AMSAuditForm;
