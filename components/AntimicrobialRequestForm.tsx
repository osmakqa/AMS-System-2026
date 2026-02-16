import React, { useState, useEffect, useMemo } from 'react';
import { DrugType, PrescriptionStatus, UserRole, PreviousAntibiotic, Organism, Susceptibility } from '../types';
import { IDS_SPECIALISTS_ADULT, IDS_SPECIALISTS_PEDIATRIC, WARDS, LOGO_URL, DETAILED_SYSTEM_SITE_OPTIONS } from '../constants';
import { ADULT_MONOGRAPHS } from '../data/adultMonographs';
import { PEDIATRIC_MONOGRAPHS } from '../data/pediatricMonographs';
import { checkRenalDosing, verifyPediatricDosing } from '../services/geminiService';

interface AntimicrobialRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  initialData?: any;
  role?: UserRole;
}

const CLINICAL_DEPARTMENTS = [
  "Internal Medicine",
  "Surgery",
  "Pediatrics",
  "Family and Community Medicine",
  "Emergency",
  "Anesthesiology",
  "Obstetrics and Gynecology",
  "Ophthalmology",
  "Otorhinolaryngology - Head and Neck Surgery",
  "Physical and Rehabilitation Medicine"
];

const INDICATION_TYPE_INFO: Record<string, { definition: string, example: string }> = {
  'Empiric': {
    definition: 'Treatment initiated based on clinical suspicion before a specific pathogen is identified.',
    example: 'Broad-spectrum coverage for suspected sepsis or pneumonia awaiting cultures.'
  },
  'Prophylactic': {
    definition: 'Use of antimicrobials to prevent infection in high-risk procedures or clinical conditions.',
    example: 'Pre-operative antibiotic given before incision or long-term prophylaxis for splenectomy.'
  },
  'Therapeutic': {
    definition: 'Targeted treatment once the specific pathogen and its drug sensitivities are known.',
    example: 'Switching to narrow-spectrum therapy based on positive blood culture results.'
  }
};

const BASIS_OPTIONS = [
  { 
    id: 'CAI', 
    label: 'Community-Acquired Infection', 
    definition: 'Symptoms started ≤48 hours from admission (or present on admission).' 
  },
  { 
    id: 'HAI', 
    label: 'Healthcare-Associated Infection', 
    definition: 'Symptoms start >48 hours after admission.' 
  },
  { 
    id: 'SP', 
    label: 'Surgical Prophylaxis', 
    definition: 'Preventative use for surgical procedures.' 
  },
  { 
    id: 'MP', 
    label: 'Medical Prophylaxis', 
    definition: 'Examples: long-term use to prevent UTIs, antifungals in chemotherapy patients, penicillin prophylaxis in asplenia, etc.' 
  },
  { 
    id: 'Others', 
    label: 'Others (Specify)', 
    definition: 'Use for clinical scenarios not covered by the standard categories above.' 
  }
];

const calcCkdEpi2021 = (age: number, sex: string, scr: number) => {
  const k = sex === "Female" ? 0.7 : 0.9;
  const alpha = sex === "Female" ? -0.241 : -0.302;
  const minScr = Math.min(scr / k, 1);
  const maxScr = Math.max(scr / k, 1);

  return 142 *
    Math.pow(minScr, alpha) *
    Math.pow(maxScr, -1.2) *
    Math.pow(0.9938, age) *
    (sex === "Female" ? 1.012 : 1);
};

const calcCkidHeightBased = (ht: number, scr: number) => {
  return 0.413 * (ht / scr);
};

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const FormGroup = ({ label, children, className = '', error }: { label: string, children?: React.ReactNode, className?: string, error?: string | boolean }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{label}</label>
    {children}
    {error && typeof error === 'string' && (
      <span className="text-[10px] font-bold text-red-500 mt-0.5">{error}</span>
    )}
  </div>
);

const Input = ({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) => (
  <input
    {...props}
    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 bg-white text-gray-900 [color-scheme:light] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.className || ''}`}
  />
);

const Select = ({ error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) => (
  <select
    {...props}
    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 bg-white text-gray-900 [color-scheme:light] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.className || ''}`}
  />
);

const Textarea = ({ error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) => (
  <textarea
    {...props}
    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 bg-white text-gray-900 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.className || ''}`}
  />
);

interface PrevAbxRowProps {
  id: number;
  value: { drug: string; frequency: string; duration: string };
  onChange: (id: number, field: string, value: string) => void;
  onRemove: (id: number) => void;
}

const PrevAbxRow: React.FC<PrevAbxRowProps> = ({ id, value, onChange, onRemove }) => (
  <div className="grid grid-cols-4 gap-2 items-center mb-1">
    <Input type="text" placeholder="Drug name" value={value.drug} onChange={(e) => onChange(id, 'drug', e.target.value)} />
    <Input type="text" placeholder="Frequency" value={value.frequency} onChange={(e) => onChange(id, 'frequency', e.target.value)} />
    <Input type="text" placeholder="Duration" value={value.duration} onChange={(e) => onChange(id, 'duration', e.target.value)} />
    <button type="button" onClick={() => onRemove(id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
  </div>
);

interface OrganismBlockProps {
  id: number;
  value: { name: string; susceptibilities: { drug: string; result: string }[] };
  onChange: (id: number, field: string, value: any) => void;
  onRemove: (id: number) => void;
}

const OrganismBlock: React.FC<OrganismBlockProps> = ({ id, value, onChange, onRemove }) => {
  const addSusceptibility = () => {
    onChange(id, 'susceptibilities', [...value.susceptibilities, { drug: '', result: '' }]);
  };

  const updateSusceptibility = (suscIndex: number, field: string, suscValue: string) => {
    const newSusceptibilities = [...value.susceptibilities];
    newSusceptibilities[suscIndex] = { ...newSusceptibilities[suscIndex], [field]: suscValue };
    onChange(id, 'susceptibilities', newSusceptibilities);
  };

  const removeSusceptibility = (suscIndex: number) => {
    const newSusceptibilities = value.susceptibilities.filter((_, i) => i !== suscIndex);
    onChange(id, 'susceptibilities', newSusceptibilities);
  };

  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-4 mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Organism Details</span>
        <button type="button" onClick={() => onRemove(id)} className="text-red-400 hover:text-red-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <FormGroup label="Organism Name"><Input type="text" placeholder="e.g., E. coli" value={value.name} onChange={(e) => onChange(id, 'name', e.target.value)} /></FormGroup>
      <FormGroup label="Susceptibilities" className="mt-4">
        <div className="space-y-2">
          {value.susceptibilities.map((susc, suscIndex) => (
            <div key={suscIndex} className="grid grid-cols-4 gap-2 items-center text-sm">
              <Input type="text" placeholder="Drug" value={susc.drug} onChange={(e) => updateSusceptibility(suscIndex, 'drug', e.target.value)} className="col-span-2" />
              <Select value={susc.result} onChange={(e) => updateSusceptibility(suscIndex, 'result', e.target.value)}>
                <option value="">N/A</option>
                <option value="S">S</option>
                <option value="I">I</option>
                <option value="R">R</option>
              </Select>
              <button type="button" onClick={() => removeSusceptibility(suscIndex)} className="text-red-400 hover:text-red-600 p-1.5 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          ))}
          <button type="button" onClick={addSusceptibility} className="flex items-center text-green-600 hover:text-green-800 text-xs font-bold gap-1 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Antibiotic
          </button>
        </div>
      </FormGroup>
    </div>
  );
};

// --- System/Site Selector Command Palette Modal ---
interface SystemSiteSelectorProps {
  onSelect: (code: string) => void;
  onClose: () => void;
}

const SystemSiteSelector: React.FC<SystemSiteSelectorProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  
  const filtered = useMemo(() => {
    return DETAILED_SYSTEM_SITE_OPTIONS.filter(opt => 
      opt.code.toLowerCase().includes(search.toLowerCase()) || 
      opt.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
        <header className="bg-gray-800 p-5 text-white flex justify-between items-center shadow-lg">
          <div>
            <h3 className="font-black uppercase tracking-tight text-lg leading-tight">Infection System / Site</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Select from Diagnostic Codes Guide</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-all"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <input 
              autoFocus
              type="text" 
              placeholder="Search site, syndrome, or example (e.g. pneumonia, abscess)..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <svg className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1">
          {filtered.length > 0 ? filtered.map(opt => (
            <button 
              key={opt.code} 
              onClick={() => onSelect(opt.code)}
              className="w-full flex items-start gap-4 p-3 md:p-4 text-left rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all group"
            >
              <div className="bg-gray-100 group-hover:bg-white group-hover:text-green-700 px-2 py-1 rounded font-mono text-[10px] md:text-xs font-black shrink-0 border border-gray-200 transition-colors uppercase tracking-tighter w-14 md:w-20 text-center">
                {opt.code}
              </div>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-bold text-gray-800 group-hover:text-green-900 leading-snug">{opt.description}</p>
              </div>
              <div className="text-gray-300 group-hover:text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          )) : (
            <div className="text-center py-10 text-gray-400 italic">No diagnostic codes found matching your search.</div>
          )}
        </div>
        
        <footer className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Excludes prophylaxis options per stewardship protocol</p>
        </footer>
      </div>
    </div>
  );
};

const AntimicrobialRequestForm: React.FC<AntimicrobialRequestFormProps> = ({ isOpen, onClose, onSubmit, loading, initialData, role }) => {
  const [patientMode, setPatientMode] = useState<'adult' | 'pediatric'>('adult');
  const [isSystemSiteSelectorOpen, setIsSystemSiteSelectorOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    req_date: getTodayDate(),
    patient_name: '', hospital_number: '', patient_dob: '', age: '', sex: '', weight_kg: '', height_cm: '', ward: '',
    mode: 'adult' as 'adult' | 'pediatric',
    diagnosis: '', system_site: '', system_site_other: '', sgpt: '', scr_mgdl: '', scr_date: '', egfr_text: '',
    is_esrd: false, // Internal state for On Dialysis checkbox
    antimicrobial: '', drug_type: DrugType.MONITORED as DrugType, dose: '', frequency: '', duration: '',
    route: 'IV',
    route_other: '',
    indication: '', 
    basis_indication: '', // Combined final string
    selectedBasisCategory: '', // New internal field
    basis_indication_details: '', // New internal field
    selectedIndicationType: '' as 'Empiric' | 'Prophylactic' | 'Therapeutic' | '',
    specimen: '',
    culture_date: '',
    resident_name: '', clinical_dept: '', service_resident_name: '', id_specialist: '',
  });

  const [prevAbxRows, setPrevAbxRows] = useState<{ id: number; drug: string; frequency: string; duration: string }[]>([{ id: 0, drug: '', frequency: '', duration: '' }]);
  const [organismBlocks, setOrganismBlocks] = useState<{ id: number; name: string; susceptibilities: { drug: string; result: string }[] }[]>([{ id: 0, name: '', susceptibilities: [{ drug: '', result: '' }] }]);
  const [scrNotAvailable, setScrNotAvailable] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [monographHtml, setMonographHtml] = useState<string>('<p>Select an antimicrobial to view its monograph.</p>');

  const [renalAnalysis, setRenalAnalysis] = useState<{ requiresAdjustment: boolean; recommendation: string } | null>(null);
  const [isCheckingRenal, setIsCheckingRenal] = useState(false);

  const [showMonograph, setShowMonograph] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isCustomWard, setIsCustomWard] = useState(false);

  const nextPrevAbxId = React.useRef(1);
  const nextOrganismId = React.useRef(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleClearAll = () => {
    if (!window.confirm("Are you sure you want to clear all entries? This action cannot be undone.")) return;
    setFormData({
      req_date: getTodayDate(),
      patient_name: '', hospital_number: '', patient_dob: '', age: '', sex: '', weight_kg: '', height_cm: '', ward: '',
      mode: 'adult' as 'adult' | 'pediatric',
      diagnosis: '', system_site: '', system_site_other: '', sgpt: '', scr_mgdl: '', scr_date: '', egfr_text: '',
      is_esrd: false,
      antimicrobial: '', drug_type: DrugType.MONITORED as DrugType, dose: '', frequency: '', duration: '',
      route: 'IV',
      route_other: '',
      indication: '', 
      basis_indication: '',
      selectedBasisCategory: '',
      basis_indication_details: '',
      selectedIndicationType: '' as 'Empiric' | 'Prophylactic' | 'Therapeutic' | '',
      specimen: '',
      culture_date: '',
      resident_name: '', clinical_dept: '', service_resident_name: '', id_specialist: '',
    });
    setPrevAbxRows([{ id: 0, drug: '', frequency: '', duration: '' }]);
    setOrganismBlocks([{ id: 0, name: '', susceptibilities: [{ drug: '', result: '' }] }]);
    setScrNotAvailable(false);
    setValidationErrors({});
    setRenalAnalysis(null);
  };

  useEffect(() => {
    if (initialData) {
      // Parse basis_indication if possible
      let category = '';
      let details = initialData.basis_indication || '';
      
      const foundOption = BASIS_OPTIONS.find(opt => details.startsWith(opt.label));
      if (foundOption) {
        category = foundOption.label;
        details = details.replace(category + ': ', '').replace(category, '').trim();
      }

      setFormData({
        ...initialData,
        req_date: initialData.req_date ? initialData.req_date.split('T')[0] : getTodayDate(),
        selectedIndicationType: (initialData.indication as any) || '',
        scr_mgdl: initialData.scr_mgdl === "Pending" ? "" : initialData.scr_mgdl,
        scr_date: initialData.scr_date || '',
        mode: initialData.mode || 'adult',
        patient_dob: initialData.patient_dob || '',
        route: initialData.route || 'IV',
        route_other: initialData.route_other || '',
        selectedBasisCategory: category,
        basis_indication_details: details,
        system_site: initialData.system_site || '',
        system_site_other: initialData.system_site_other || '',
        is_esrd: initialData.is_esrd || false,
        culture_date: initialData.culture_date || '',
        specimen: initialData.specimen || ''
      });

      if (initialData.scr_mgdl === "Pending") setScrNotAvailable(true);
      if (initialData.mode) setPatientMode(initialData.mode);

      try {
        const rawPrev = initialData.previous_antibiotics;
        const parsedPrevAbx = typeof rawPrev === 'string' ? JSON.parse(rawPrev) : rawPrev;
        if (Array.isArray(parsedPrevAbx) && parsedPrevAbx.length > 0) {
          setPrevAbxRows(parsedPrevAbx.map((item: any, idx: number) => ({
            id: idx,
            drug: item.drug || '',
            frequency: item.frequency || '',
            duration: item.duration || ''
          })));
          nextPrevAbxId.current = parsedPrevAbx.length;
        }
      } catch (e) { console.log('Error loading prev abx', e); }

      try {
        const rawOrgs = initialData.organisms;
        const parsedOrgs = typeof rawOrgs === 'string' ? JSON.parse(rawOrgs) : rawOrgs;
        if (Array.isArray(parsedOrgs) && parsedOrgs.length > 0) {
          setOrganismBlocks(parsedOrgs.map((item: any, idx: number) => ({
            id: idx,
            name: item.name || '',
            susceptibilities: Array.isArray(item.susceptibilities) ? item.susceptibilities : []
          })));
          nextOrganismId.current = parsedOrgs.length;
        }
      } catch (e) { console.log('Error loading organisms', e); }
    }
  }, [initialData]);

  // --- AUTOMATIC AGE CALCULATION ---
  useEffect(() => {
    if (patientMode === 'pediatric' && formData.patient_dob && formData.req_date) {
      const birth = new Date(formData.patient_dob);
      const req = new Date(formData.req_date);
      
      if (birth > req) {
        setFormData(prev => ({ ...prev, age: 'Invalid DOB' }));
        return;
      }

      let years = req.getFullYear() - birth.getFullYear();
      let months = req.getMonth() - birth.getMonth();
      let days = req.getDate() - birth.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(req.getFullYear(), req.getMonth(), 0);
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

      setFormData(prev => ({ ...prev, age: parts.join(' ') }));
    }
  }, [formData.patient_dob, formData.req_date, patientMode]);

  const drugLists = useMemo(() => {
    const processList = (monographs: Record<string, any>) => {
      const list: any[] = [];
      const seenFluconazole = new Set();

      Object.entries(monographs).forEach(([drugKey, meta]) => {
        let label = drugKey;
        let value = drugKey;
        
        // Consolidate Fluconazole entries for selection
        if (drugKey.toLowerCase().includes('fluconazole')) {
          if (seenFluconazole.has('fluconazole')) return;
          label = 'Fluconazole';
          value = 'Fluconazole';
          seenFluconazole.add('fluconazole');
        }

        list.push({
          value: value,
          label: label,
          type: meta.restricted ? DrugType.RESTRICTED : DrugType.MONITORED,
          weightBased: meta.weightBased
        });
      });
      return list.sort((a, b) => a.label.localeCompare(b.label));
    };

    return { 
      adult: processList(ADULT_MONOGRAPHS), 
      pediatric: processList(PEDIATRIC_MONOGRAPHS) 
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const runRenalCheck = async () => {
      if (!formData.antimicrobial || !formData.egfr_text || formData.egfr_text.includes('—') || formData.egfr_text === 'Pending') {
        if (isActive) setRenalAnalysis(null);
        return;
      }

      // Determine lookup key for Fluconazole based on route
      let lookupKey = formData.antimicrobial;
      if (lookupKey === 'Fluconazole') {
        lookupKey = formData.route === 'IV' ? 'Fluconazole IV' : 'Fluconazole oral';
      }

      const monograph = patientMode === 'adult'
        ? ADULT_MONOGRAPHS[lookupKey]
        : PEDIATRIC_MONOGRAPHS[lookupKey];

      if (!monograph || !monograph.renal) {
        if (isActive) setRenalAnalysis(null);
        return;
      }
      if (isActive) setIsCheckingRenal(true);
      const result = await checkRenalDosing(
        formData.antimicrobial, 
        formData.egfr_text, 
        monograph.renal,
        formData.dose,
        formData.frequency
      );

      if (isActive) {
        setIsCheckingRenal(false);
        if (result && result.requiresAdjustment) {
          setRenalAnalysis(result);
        } else {
          setRenalAnalysis(null);
        }
      }
    };
    const timeoutId = setTimeout(runRenalCheck, 1500);
    return () => { isActive = false; clearTimeout(timeoutId); };
  }, [formData.egfr_text, formData.antimicrobial, patientMode, formData.dose, formData.frequency, formData.route]);

  useEffect(() => {
    const currentDrug = formData.antimicrobial;
    const drugOptions = drugLists[patientMode];
    const selectedDrugMeta = drugOptions.find(d => d.value === currentDrug);

    let drugType = selectedDrugMeta ? (selectedDrugMeta.type || DrugType.MONITORED) : DrugType.MONITORED;
    
    // CUSTOM FLUCONAZOLE LOGIC
    if (currentDrug === 'Fluconazole') {
      drugType = formData.route === 'IV' ? DrugType.RESTRICTED : DrugType.MONITORED;
    }

    setFormData(prev => ({
      ...prev,
      drug_type: drugType,
      service_resident_name: drugType === DrugType.RESTRICTED ? prev.service_resident_name : '',
      id_specialist: drugType === DrugType.RESTRICTED ? prev.id_specialist : '',
    }));

    if (!selectedDrugMeta) {
      setMonographHtml(currentDrug ? `<p class="text-gray-700"><strong>${currentDrug}</strong>: No monograph found.</p>` : '<p class="text-gray-600">Select an antimicrobial to view its monograph.</p>');
      return;
    }
    
    let lookupKey = currentDrug;
    if (currentDrug === 'Fluconazole') {
      lookupKey = formData.route === 'IV' ? 'Fluconazole IV' : 'Fluconazole oral';
    }

    const monograph = patientMode === 'adult' ? ADULT_MONOGRAPHS[lookupKey] : PEDIATRIC_MONOGRAPHS[lookupKey];
    if (monograph) {
      let html = `<h3 class="font-bold text-gray-800 text-lg mb-2">${lookupKey} – ${patientMode === "adult" ? "Adult" : "Pediatric"} Monograph</h3>`;
      if (monograph.spectrum) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Spectrum:</strong> ${monograph.spectrum}</p>`;
      if (monograph.dosing) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Dosing:</strong> ${monograph.dosing}</p>`;
      if (monograph.renal) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Renal adj:</strong> ${monograph.renal}</p>`;
      if (monograph.hepatic) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Hepatic adj:</strong> ${monograph.hepatic}</p>`;
      if (monograph.duration) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Typical duration:</strong> ${monograph.duration}</p>`;
      if (monograph.monitoring) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Monitoring:</strong> ${monograph.monitoring}</p>`;
      if (monograph.warnings) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">Warnings:</strong> ${monograph.warnings}</p>`;
      if (monograph.ams) html += `<p class="mb-1 text-gray-700"><strong class="text-gray-900">AMS Guidance:</strong> ${monograph.ams}</p>`;
      setMonographHtml(html);
    } else {
      setMonographHtml(currentDrug ? `<p class="text-gray-700"><strong>${currentDrug}</strong>: No monograph found.</p>` : '<p class="text-gray-600">Select an antimicrobial to view its monograph.</p>');
    }
  }, [patientMode, formData.antimicrobial, drugLists, formData.route]);

  useEffect(() => {
    updateEgfr();
  }, [patientMode, formData.age, formData.sex, formData.weight_kg, formData.height_cm, formData.scr_mgdl, scrNotAvailable]);

  const updateEgfr = () => {
    const { age, sex, weight_kg, height_cm, scr_mgdl } = formData;
    let egfrText = '—';

    if (scrNotAvailable) {
      egfrText = 'Pending';
    } else {
      let ageNum = parseFloat(age);
      let scrNum = parseFloat(scr_mgdl);
      let heightNum = parseFloat(height_cm);

      if (!isNaN(scrNum) && scrNum > 0) scrNum = scrNum / 88.4;

      if (isNaN(ageNum) || !sex || isNaN(scrNum)) {
        egfrText = '—';
      } else if (patientMode === 'adult') {
        const egfr = calcCkdEpi2021(ageNum, sex, scrNum);
        egfrText = isFinite(egfr) ? egfr.toFixed(1) + ' mL/min/1.73m²' : '—';
      } else {
        if (isNaN(heightNum)) {
          egfrText = 'Enter height for pediatric eGFR.';
        } else {
          const egfr = calcCkidHeightBased(heightNum, scrNum);
          egfrText = isFinite(egfr) ? egfr.toFixed(1) + ' mL/min/1.73m²' : '—';
        }
      }
    }
    setFormData(prev => ({ ...prev, egfr_text: egfrText }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const requiredFields: (keyof typeof formData)[] = [
      'patient_name', 'age', 'sex', 'weight_kg', 'hospital_number', 'ward', 'diagnosis', 'system_site',
      'antimicrobial', 'dose', 'frequency', 'duration', 'route', 'selectedIndicationType',
      'resident_name', 'clinical_dept', 'req_date', 'selectedBasisCategory'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        errors[field as string] = `${String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`;
      }
    });

    if (formData.selectedIndicationType === 'Therapeutic') {
      if (!formData.specimen || formData.specimen.trim() === '') {
        errors.specimen = 'Specimen source is required for Therapeutic indication.';
      }
      if (!formData.culture_date) {
        errors.culture_date = 'Culture date is required for Therapeutic indication.';
      }
      const validOrgs = organismBlocks.filter(b => b.name && b.name.trim() !== '');
      if (validOrgs.length === 0) {
        errors.organisms = 'At least one organism name is required for Therapeutic indication.';
      } else {
        const hasMissingSusceptibility = validOrgs.some(org => 
            org.susceptibilities.filter(s => s.drug && s.drug.trim() !== '').length === 0
        );
        if (hasMissingSusceptibility) {
            errors.organisms = 'At least one susceptibility antibiotic is required for each organism in Therapeutic indication.';
        }
      }
    }

    if (formData.selectedBasisCategory === 'Others (Specify)' && !formData.basis_indication_details.trim()) {
      errors.basis_indication_details = 'Please specify the clinical justification.';
    }

    if (formData.system_site === 'OTHERS (SPECIFY)' && !formData.system_site_other.trim()) {
      errors.system_site_other = 'Please specify the System/Site.';
    }

    // CLINICAL VALIDATION: Adult Age Check
    if (patientMode === 'adult' && formData.age) {
      const ageNum = parseFloat(formData.age);
      if (!isNaN(ageNum) && ageNum < 18) {
        errors.age = 'Adult patients must be 18 years or older. Switch to Pediatric mode for younger patients.';
      }
    }

    if (formData.route === 'Others' && !formData.route_other) {
      errors.route_other = 'Please specify the custom route.';
    }

    if (patientMode === 'pediatric' && !formData.patient_dob) {
        errors.patient_dob = 'Date of Birth is required for pediatric patients.';
    }

    if (!scrNotAvailable && (!formData.scr_mgdl || String(formData.scr_mgdl).trim() === '')) {
      errors.scr_mgdl = 'Serum Creatinine is required unless marked as not yet available.';
    }

    if (!scrNotAvailable && formData.scr_mgdl && !formData.scr_date) {
      errors.scr_date = 'Date of SCr result is required if SCr is provided.';
    }

    if (patientMode === 'pediatric' && (!formData.height_cm || String(formData.height_cm).trim() === '')) {
      errors.height_cm = 'Height is required for pediatric patients.';
    }

    const selectedDrugMeta = drugLists[patientMode].find(d => d.value === formData.antimicrobial);
    let isRestricted = selectedDrugMeta?.type === DrugType.RESTRICTED;
    if (formData.antimicrobial === 'Fluconazole') {
      isRestricted = formData.route === 'IV';
    }

    if (isRestricted) {
      if (!formData.service_resident_name || String(formData.service_resident_name).trim() === '') {
        errors.service_resident_name = 'IDS Rotator (IM/Pedia) is required for restricted antimicrobials.';
      }
      if (!formData.id_specialist || String(formData.id_specialist).trim() === '') {
        errors.id_specialist = 'ID Specialist is required for restricted antimicrobials.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openReview = () => {
    // If the user is an AMS Admin, bypass mandatory field validation
    if (role !== UserRole.AMS_ADMIN && !validateForm()) {
      const firstErrorField = Object.keys(validationErrors)[0] as string | undefined;
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    setShowReview(true);
  };

  const confirmAndSubmit = async () => {
    const finalBasis = `${formData.selectedBasisCategory}${formData.basis_indication_details ? ': ' + formData.basis_indication_details : ''}`;

    const payload: any = {
      ...formData,
      req_date: new Date(formData.req_date).toISOString(),
      timestamp: new Date().toISOString(),
      scr_mgdl: scrNotAvailable ? "Pending" : formData.scr_mgdl,
      scr_date: scrNotAvailable ? null : formData.scr_date,
      indication: formData.selectedIndicationType,
      basis_indication: finalBasis,
      route: formData.route === 'Others' ? formData.route_other : formData.route,
      previous_antibiotics: prevAbxRows
        .filter(r => r.drug || r.frequency || r.duration)
        .map(({ drug, frequency, duration }) => ({ drug, frequency, duration })),
      organisms: organismBlocks
        .filter(b => b.name || b.susceptibilities.some(s => s.drug || s.result))
        .map(({ name, susceptibilities }) => ({ 
          name, 
          susceptibilities: susceptibilities.filter(s => s.drug || s.result) 
        })),
      status: PrescriptionStatus.PENDING,
      resident_name: formData.resident_name,
      service_resident_name: formData.drug_type === DrugType.RESTRICTED ? formData.service_resident_name : null,
      id_specialist: formData.drug_type === DrugType.RESTRICTED ? formData.id_specialist : null,
      dispensed_by: null,
      dispensed_date: null,
      disapproved_reason: null,
      ids_approved_at: null,
      ids_disapproved_at: null,
      findings: []
    };

    // Remove internal UI-only state keys
    delete payload.selectedIndicationType;
    delete payload.selectedBasisCategory;
    delete payload.basis_indication_details;

    // Remove empty values to keep doc clean
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    if (initialData && initialData.id) {
      payload.id = initialData.id;
    }

    await onSubmit(payload);
  };

  const handleModeChange = (mode: 'adult' | 'pediatric') => {
    setPatientMode(mode);
    setFormData(prev => ({ ...prev, mode: mode }));
    setValidationErrors({});
  };

  const addPrevAbxRow = () => {
    setPrevAbxRows(prev => [...prev, { id: nextPrevAbxId.current++, drug: '', frequency: '', duration: '' }]);
  };

  const updatePrevAbxRow = (id: number, field: string, value: string) => {
    setPrevAbxRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removePrevAbxRow = (id: number) => {
    setPrevAbxRows(prev => prev.filter(row => row.id !== id));
  };

  const addOrganismBlock = () => {
    setOrganismBlocks(prev => [...prev, { id: nextOrganismId.current++, name: '', susceptibilities: [{ drug: '', result: '' }] }]);
  };

  const updateOrganismBlock = (id: number, field: string, value: any) => {
    setOrganismBlocks(prev => prev.map(block => (block.id === id ? { ...block, [field]: value } : block)));
  };

  const removeOrganismBlock = (id: number) => {
    setOrganismBlocks(prev => prev.filter(block => block.id !== id));
  };

  const SummaryCard = ({ title, children, className = '' }: { title: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2">{title}</h4>
      {children}
    </div>
  );

  const SummaryValue = ({ label, value, className = '' }: { label: string, value: any, className?: string }) => (
    <div className={className}>
      <p className="text-[10px] text-gray-400 uppercase font-black tracking-tight mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-bold leading-snug">{value || '—'}</p>
    </div>
  );

  const selectedBasisDefinition = useMemo(() => {
    const opt = BASIS_OPTIONS.find(o => o.label === formData.selectedBasisCategory);
    return opt ? opt.definition : '';
  }, [formData.selectedBasisCategory]);

  const selectedIndicationInfo = useMemo(() => {
    return INDICATION_TYPE_INFO[formData.selectedIndicationType] || null;
  }, [formData.selectedIndicationType]);

  const currentSystemSiteDesc = useMemo(() => {
    const found = DETAILED_SYSTEM_SITE_OPTIONS.find(opt => opt.code === formData.system_site);
    return found ? found.description : '';
  }, [formData.system_site]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      {isSystemSiteSelectorOpen && (
        <SystemSiteSelector 
          onClose={() => setIsSystemSiteSelectorOpen(false)} 
          onSelect={(code) => {
            setFormData(prev => ({ ...prev, system_site: code }));
            setIsSystemSiteSelectorOpen(false);
          }} 
        />
      )}
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 relative" onClick={(e) => e.stopPropagation()}>
        
        {/* Main Header */}
        <header className="flex items-center justify-between gap-4 bg-[#009a3e] text-white px-6 py-4 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold leading-tight uppercase tracking-tight">Antimicrobial Request</h3>
              <span className="text-[11px] font-bold text-white/80 tracking-wide">Antimicrobial Stewardship</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* Form Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50 space-y-8">
            <div className="flex justify-center mb-4">
                <div className="inline-flex rounded-xl bg-gray-200 p-1 shadow-inner">
                    <button type="button" className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${patientMode === 'adult' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => handleModeChange('adult')}>Adult Patient</button>
                    <button type="button" className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${patientMode === 'pediatric' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => handleModeChange('pediatric')}>Pediatric Patient</button>
                </div>
            </div>

            <form className="space-y-8 max-w-4xl mx-auto">
                {/* Profile Section */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Patient Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormGroup label="Request Date" error={validationErrors.req_date}><Input id="req_date" error={!!validationErrors.req_date} type="date" name="req_date" value={formData.req_date} onChange={handleChange} /></FormGroup>
                        <FormGroup label="Full Name (Last, First)" className="md:col-span-2" error={validationErrors.patient_name}><Input id="patient_name" error={!!validationErrors.patient_name} name="patient_name" value={formData.patient_name} onChange={handleChange} placeholder="e.g. Dela Cruz, Juan" /></FormGroup>
                        <FormGroup label="Hospital Number" error={validationErrors.hospital_number}><Input id="hospital_number" error={!!validationErrors.hospital_number} name="hospital_number" value={formData.hospital_number} onChange={handleChange} placeholder="ID Number" /></FormGroup>
                        {patientMode === 'pediatric' ? (
                          <>
                             <FormGroup label="Date of Birth" error={validationErrors.patient_dob}><Input id="patient_dob" error={!!validationErrors.patient_dob} type="date" name="patient_dob" value={formData.patient_dob} onChange={handleChange} /></FormGroup>
                             <FormGroup label="Calculated Age"><div className="h-[38px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700">{formData.age}</div></FormGroup>
                          </>
                        ) : (
                          <FormGroup label="Age" error={validationErrors.age}><Input id="age" error={!!validationErrors.age} type="number" name="age" value={formData.age} onChange={handleChange} /></FormGroup>
                        )}
                        <FormGroup label="Sex" error={validationErrors.sex}><Select id="sex" error={!!validationErrors.sex} name="sex" value={formData.sex} onChange={handleChange}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></Select></FormGroup>
                        <FormGroup label="Weight (kg)" error={validationErrors.weight_kg}><Input id="weight_kg" error={!!validationErrors.weight_kg} type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} /></FormGroup>
                        <FormGroup label="Height (cm)" className={patientMode === 'pediatric' ? '' : 'hidden'} error={validationErrors.height_cm}><Input id="height_cm" error={!!validationErrors.height_cm} type="number" step="0.1" name="height_cm" value={formData.height_cm} onChange={handleChange} /></FormGroup>
                        <FormGroup label="Ward / Unit" className="md:col-span-2" error={validationErrors.ward}>
                             <Select id="ward" error={!!validationErrors.ward} value={isCustomWard ? 'Others' : formData.ward} onChange={(e) => { const v = e.target.value; if(v==='Others') setIsCustomWard(true); else { setIsCustomWard(false); setFormData(p=>({...p, ward: v})); } }}>
                                <option value="">Select Ward</option>
                                {WARDS.map((w: string) => <option key={w} value={w}>{w}</option>)}
                                <option value="Others">Others (Specify)</option>
                             </Select>
                             {isCustomWard && <Input error={!!validationErrors.ward} className="mt-2" placeholder="Specify..." value={formData.ward} onChange={e => setFormData(p=>({...p, ward: e.target.value}))} />}
                        </FormGroup>
                    </div>
                </section>

                {/* Clinical Section */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Clinical Data</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Primary Diagnosis" error={validationErrors.diagnosis}><Input id="diagnosis" error={!!validationErrors.diagnosis} name="diagnosis" value={formData.diagnosis} onChange={handleChange} placeholder="Primary working diagnosis" /></FormGroup>
                        
                        <FormGroup label="System / Site" error={validationErrors.system_site}>
                            <button 
                              type="button"
                              onClick={() => setIsSystemSiteSelectorOpen(true)}
                              className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition-all text-left bg-white shadow-sm ${validationErrors.system_site ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900 hover:border-green-500'}`}
                            >
                              <span className="truncate">
                                {formData.system_site ? (
                                  <>
                                    <span className="font-mono font-black text-green-700 mr-2">{formData.system_site}</span>
                                    <span className="text-gray-500 truncate">{currentSystemSiteDesc}</span>
                                  </>
                                ) : "Click to select System/Site..."}
                              </span>
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            
                            {formData.system_site === 'OTHERS (SPECIFY)' && (
                                <Input 
                                    id="system_site_other" 
                                    error={!!validationErrors.system_site_other} 
                                    name="system_site_other" 
                                    value={formData.system_site_other} 
                                    onChange={handleChange} 
                                    placeholder="Specify site..." 
                                    className="mt-2"
                                />
                            )}
                        </FormGroup>

                        <FormGroup label="Indication Type" error={validationErrors.selectedIndicationType}>
                             <div id="selectedIndicationType" className={`flex gap-2 p-1 rounded-lg ${validationErrors.selectedIndicationType ? 'border border-red-500 bg-red-50' : ''}`}>
                                {(['Empiric', 'Prophylactic', 'Therapeutic'] as const).map(ind => (
                                    <button key={ind} type="button" onClick={() => setFormData(p=>({...p, selectedIndicationType: ind}))} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formData.selectedIndicationType === ind ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}>{ind}</button>
                                ))}
                             </div>
                             
                             {selectedIndicationInfo && (
                                <div className="mt-3 animate-fade-in">
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg shadow-sm">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Classification Guide</p>
                                        <p className="text-xs text-blue-800 font-medium leading-relaxed italic">{selectedIndicationInfo.definition}</p>
                                        <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase tracking-tighter">Example: <span className="font-normal normal-case italic text-blue-700">{selectedIndicationInfo.example}</span></p>
                                    </div>
                                </div>
                             )}
                        </FormGroup>
                        
                        <FormGroup label="Basis for Indication" className="md:col-span-2" error={validationErrors.selectedBasisCategory}>
                            <Select 
                                id="selectedBasisCategory" 
                                error={!!validationErrors.selectedBasisCategory} 
                                name="selectedBasisCategory" 
                                value={formData.selectedBasisCategory} 
                                onChange={handleChange}
                            >
                                <option value="">Select Basis Category...</option>
                                {BASIS_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.label}>{opt.label}</option>
                                ))}
                            </Select>
                            
                            {formData.selectedBasisCategory && (
                                <div className="mt-3 animate-fade-in">
                                    {/* Definition Callout */}
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded-r-lg shadow-sm">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Definition</p>
                                        <p className="text-xs text-blue-800 font-medium leading-relaxed italic">{selectedBasisDefinition}</p>
                                    </div>

                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1 block">Clinical Justification / Remarks</label>
                                    <Textarea 
                                        id="basis_indication_details"
                                        error={!!validationErrors.basis_indication_details}
                                        name="basis_indication_details" 
                                        value={formData.basis_indication_details} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Specify symptoms, lab results, or specific reason for prophylaxis..."
                                    />
                                    {validationErrors.basis_indication_details && <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors.basis_indication_details}</p>}
                                </div>
                            )}
                        </FormGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                        <FormGroup label="Serum Creatinine (µmol/L)" className="md:col-span-2" error={validationErrors.scr_mgdl}>
                             <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Input id="scr_mgdl" error={!!validationErrors.scr_mgdl} type="number" name="scr_mgdl" value={formData.scr_mgdl} onChange={handleChange} disabled={scrNotAvailable} className="flex-1" />
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                                            <input type="checkbox" checked={scrNotAvailable} onChange={e => setScrNotAvailable(e.target.checked)} className="rounded border-gray-300 text-green-600 h-4 w-4" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Pending</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                                            <input type="checkbox" name="is_esrd" checked={formData.is_esrd} onChange={handleChange} className="rounded border-gray-300 text-red-600 h-4 w-4" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">On Dialysis</span>
                                        </label>
                                    </div>
                                </div>
                             </div>
                        </FormGroup>
                        {!scrNotAvailable && formData.scr_mgdl && (
                          <FormGroup label="SCr Result Date" error={validationErrors.scr_date}>
                            <Input id="scr_date" error={!!validationErrors.scr_date} type="date" name="scr_date" value={formData.scr_date} onChange={handleChange} max={getTodayDate()} />
                          </FormGroup>
                        )}
                        <FormGroup label="SGPT (U/L)"><Input type="number" name="sgpt" value={formData.sgpt} onChange={handleChange} /></FormGroup>
                        <FormGroup label="Calculated eGFR"><div className="h-[38px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-blue-700">{formData.egfr_text}</div></FormGroup>
                    </div>
                </section>

                {/* Microbiology Section */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Microbiology & History</h4>
                    
                    {/* Previous Antibiotics */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Previous Antibiotics (Last 30 days)</label>
                            <button type="button" onClick={addPrevAbxRow} className="text-green-600 hover:text-green-800 text-xs font-bold flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Drug
                            </button>
                        </div>
                        <div className="space-y-2">
                            {prevAbxRows.map(row => (
                                <PrevAbxRow key={row.id} id={row.id} value={row} onChange={updatePrevAbxRow} onRemove={removePrevAbxRow} />
                            ))}
                        </div>
                    </div>

                    {/* Microbiology */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Culture & Sensitivity</label>
                            <button type="button" onClick={addOrganismBlock} className="text-green-600 hover:text-green-800 text-xs font-bold flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Organism
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormGroup label="Specimen Source" error={validationErrors.specimen}><Input id="specimen" error={!!validationErrors.specimen} name="specimen" value={formData.specimen} onChange={handleChange} placeholder="e.g. Blood, Urine, Sputum" /></FormGroup>
                            <FormGroup label="Culture Date" error={validationErrors.culture_date}><Input id="culture_date" error={!!validationErrors.culture_date} type="date" name="culture_date" value={formData.culture_date} onChange={handleChange} max={getTodayDate()} /></FormGroup>
                        </div>
                        {validationErrors.organisms && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase">{validationErrors.organisms}</p>}
                        <div className="mt-3 space-y-3">
                            {organismBlocks.map(block => (
                                <OrganismBlock key={block.id} id={block.id} value={block} onChange={updateOrganismBlock} onRemove={removeOrganismBlock} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Medication Section */}
                <section className="bg-[#f0f9ff] p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                        <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Medication Request</h4>
                        <button type="button" onClick={() => setShowMonograph(!showMonograph)} className="text-[10px] font-bold text-blue-600 hover:underline uppercase">{showMonograph ? 'Hide Monograph' : 'View Monograph'}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormGroup label="Antimicrobial" className="md:col-span-2" error={validationErrors.antimicrobial}>
                            <Select id="antimicrobial" error={!!validationErrors.antimicrobial} name="antimicrobial" value={formData.antimicrobial} onChange={handleChange}>
                                <option value="">Select Drug</option>
                                {drugLists[patientMode].map(d => <option key={d.value} value={d.value}>{d.label} ({d.type})</option>)}
                            </Select>
                        </FormGroup>
                        <FormGroup label="Drug Type"><div className={`h-[38px] flex items-center justify-center px-3 rounded-lg text-xs font-black uppercase tracking-widest border ${formData.drug_type === DrugType.RESTRICTED ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>{formData.drug_type}</div></FormGroup>
                        
                        <FormGroup label="Route" error={validationErrors.route}>
                            <Select id="route" error={!!validationErrors.route} name="route" value={formData.route} onChange={handleChange}>
                                <option value="IV">IV</option>
                                <option value="IM">IM</option>
                                <option value="Oral">Oral</option>
                                <option value="Others">Others (Specify)</option>
                            </Select>
                        </FormGroup>
                        {formData.route === 'Others' && (
                            <FormGroup label="Specify Route" error={validationErrors.route_other}>
                                <Input id="route_other" error={!!validationErrors.route_other} name="route_other" value={formData.route_other} onChange={handleChange} placeholder="Enter route..." />
                            </FormGroup>
                        )}
                        
                        <FormGroup label="Dose" error={validationErrors.dose}><Input id="dose" error={!!validationErrors.dose} name="dose" value={formData.dose} onChange={handleChange} placeholder="e.g. 1g" /></FormGroup>
                        <FormGroup label="Frequency" error={validationErrors.frequency}><Input id="frequency" error={!!validationErrors.frequency} name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g. q8h" /></FormGroup>
                        <FormGroup label="Duration (Days)" error={validationErrors.duration}><Input id="duration" error={!!validationErrors.duration} name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 7" /></FormGroup>
                    </div>
                    {showMonograph && (
                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm animate-fade-in max-h-48 overflow-y-auto text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: monographHtml }} />
                    )}
                    {renalAnalysis && (
                        <div className="space-y-2">
                            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-xs rounded-lg font-medium shadow-sm"><strong>Renal Guardrail:</strong> {renalAnalysis.recommendation}</div>
                        </div>
                    )}
                </section>

                {/* Personnel Section */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Accountability</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Resident In-Charge" error={validationErrors.resident_name}><Input id="resident_name" error={!!validationErrors.resident_name} name="resident_name" value={formData.resident_name} onChange={handleChange} placeholder="Ordering physician" /></FormGroup>
                        <FormGroup label="Clinical Department" error={validationErrors.clinical_dept}><Select id="clinical_dept" error={!!validationErrors.clinical_dept} name="clinical_dept" value={formData.clinical_dept} onChange={handleChange}><option value="">Select Dept</option>{CLINICAL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</Select></FormGroup>
                        {formData.drug_type === DrugType.RESTRICTED && (
                            <>
                                <FormGroup label="IDS Rotator (IM/Pedia)" error={validationErrors.service_resident_name}><Input id="service_resident_name" error={!!validationErrors.service_resident_name} name="service_resident_name" value={formData.service_resident_name} onChange={handleChange} placeholder="IM/Pedia Resident" /></FormGroup>
                                <FormGroup label="ID Specialist" error={validationErrors.id_specialist}><Select id="id_specialist" error={!!validationErrors.id_specialist} name="id_specialist" value={formData.id_specialist} onChange={handleChange}><option value="">Select Specialist</option>{(patientMode === 'adult' ? IDS_SPECIALISTS_ADULT : IDS_SPECIALISTS_PEDIATRIC).map(s => <option key={s} value={s}>{s}</option>)}</Select></FormGroup>
                            </>
                        )}
                    </div>
                </section>
            </form>
        </div>

        {/* Footer */}
        <footer className="p-4 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 shrink-0 px-6 md:px-8">
            <button 
              type="button" 
              onClick={handleClearAll} 
              className="w-full md:w-auto px-6 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-red-100 md:border-transparent"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear All
            </button>
            <div className="flex gap-2 w-full md:w-auto">
                <button type="button" onClick={onClose} className="flex-1 md:flex-none px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-all border border-gray-200">Cancel</button>
                <button type="button" onClick={openReview} disabled={loading} className="flex-[2] md:flex-none px-10 py-2.5 bg-[#009a3e] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Review Request
                </button>
            </div>
        </footer>

        {/* Review Overlay */}
        {showReview && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowReview(false)}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-slide-up font-['Inter']" onClick={e => e.stopPropagation()}>
                    <header className="bg-[#009a3e] text-white p-6 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Final Verification</h3>
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Confirm clinical data before submission</p>
                            </div>
                        </div>
                        <button onClick={() => setShowReview(false)} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SummaryCard title="Patient Profile">
                                <h3 className="text-2xl font-black text-gray-900 mb-0.5 capitalize tracking-tight">{formData.patient_name || 'Anonymous'}</h3>
                                <p className="text-xs font-mono font-bold text-gray-400 mb-6 bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">{formData.hospital_number}</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <SummaryValue label="AGE / SEX" value={`${formData.age} / ${formData.sex}`} />
                                    <SummaryValue label="WT / HT" value={`${formData.weight_kg}kg / ${formData.height_cm || '?'}cm`} />
                                    <SummaryValue label="WARD" value={formData.ward} />
                                    <SummaryValue label="MODE" value={patientMode.toUpperCase()} className="text-green-600" />
                                </div>
                            </SummaryCard>

                            <SummaryCard title="Clinical Findings">
                                <div className="flex gap-2 mb-4">
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-widest border border-yellow-200">
                                        {formData.selectedIndicationType} Indication
                                    </div>
                                    {formData.is_esrd && (
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-widest border border-red-200">
                                            On Dialysis Status
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    <SummaryValue label="DIAGNOSIS" value={`${formData.diagnosis} (${formData.system_site === 'OTHERS (SPECIFY)' ? formData.system_site_other : formData.system_site})`} />
                                    <SummaryValue label="BASIS FOR INDICATION" value={`${formData.selectedBasisCategory}${formData.basis_indication_details ? ': ' + formData.basis_indication_details : ''}`} />
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <SummaryValue label="SCR" value={scrNotAvailable ? 'PENDING' : `${formData.scr_mgdl} (Date: ${formData.scr_date || 'N/A'})`} />
                                        <SummaryValue label="SGPT" value={formData.sgpt} />
                                        <SummaryValue label="EGFR" value={formData.egfr_text?.split(' ')?.[0] || '—'} />
                                    </div>
                                </div>
                            </SummaryCard>

                            <SummaryCard title="Microbiology & History">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Previous Antibiotics</p>
                                        <div className="text-sm font-medium text-gray-800 space-y-1">
                                            {prevAbxRows.filter(r => r.drug).length > 0 ? (
                                                prevAbxRows.filter(r => r.drug).map((r, i) => (
                                                    <p key={i}>{r.drug} - {r.duration} ({r.frequency})</p>
                                                ))
                                            ) : <span className="text-gray-400 italic">None recorded</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Specimen & Culture</p>
                                        <p className="text-sm font-bold text-gray-800">{formData.specimen || 'Not specified'}{formData.culture_date && ` (Date: ${new Date(formData.culture_date).toLocaleDateString()})`}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Organisms</p>
                                        <div className="text-sm font-medium text-gray-800 space-y-2">
                                            {organismBlocks.filter(b => b.name).length > 0 ? (
                                                organismBlocks.filter(b => b.name).map((b, i) => (
                                                    <div key={i}>
                                                        <span className="font-bold">{b.name}</span>
                                                        {b.susceptibilities.filter(s => s.drug).length > 0 && (
                                                            <ul className="pl-2 mt-1 text-xs text-gray-600 border-l-2 border-gray-200">
                                                                {b.susceptibilities.filter(s => s.drug).map((s: any, j: number) => (
                                                                    <li key={j}>{s.drug}: <span className={s.result === 'S' ? 'text-green-600 font-bold' : (s.result === 'R' ? 'text-red-600 font-bold' : '')}>{s.result}</span></li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))
                                            ) : <span className="text-gray-400 italic">None recorded</span>}
                                        </div>
                                    </div>
                                </div>
                            </SummaryCard>

                            <div className="md:col-span-2 bg-[#f0f7ff] rounded-3xl border border-blue-100 p-8 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Medication Name</p>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black text-blue-900 tracking-tight">{formData.antimicrobial}</h2>
                                            <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${formData.drug_type === DrugType.RESTRICTED ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{formData.drug_type}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Route: </span>
                                            <span className="text-sm font-bold text-blue-800">{formData.route === 'Others' ? formData.route_other : formData.route}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-8 text-right">
                                        <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">DOSE</p><p className="text-2xl font-black text-blue-900 leading-tight">{formData.dose}</p></div>
                                        <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">FREQ</p><p className="text-sm font-black text-blue-900 leading-tight">Every {formData.frequency?.replace('q','')}</p><p className="text-[9px] font-black text-blue-400 uppercase">Hours</p></div>
                                        <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">DAYS</p><p className="text-2xl font-black text-blue-900 leading-tight">{formData.duration}</p></div>
                                    </div>
                                </div>
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-blue-200/50">
                                    <div className="flex gap-8">
                                        <SummaryValue label="RESIDENT IN-CHARGE" value={formData.resident_name} />
                                        {formData.id_specialist && <SummaryValue label="IDS CONSULTANT" value={formData.id_specialist} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button onClick={() => setShowReview(false)} className="px-8 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all uppercase text-xs tracking-widest">Back to Edit</button>
                        <button onClick={confirmAndSubmit} disabled={loading} className="px-12 py-3 bg-[#009a3e] text-white rounded-2xl font-black shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 transform active:scale-95 uppercase text-xs tracking-widest">
                            {loading ? 'Submitting...' : 'Confirm & Submit'}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                    </footer>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AntimicrobialRequestForm;