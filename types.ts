
export enum UserRole {
  PHARMACIST = 'PHARMACIST',
  IDS = 'IDS',
  AMS_ADMIN = 'AMS_ADMIN',
  RESIDENT = 'RESIDENT'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export enum PrescriptionStatus {
  PENDING = 'pending',
  FOR_IDS_APPROVAL = 'for_ids_approval',
  APPROVED = 'approved',
  DISAPPROVED = 'disapproved',
  DELETED = 'deleted'
}

export enum DrugType {
  MONITORED = 'Monitored',
  RESTRICTED = 'Restricted'
}

export enum ActionType {
  APPROVE = 'APPROVE',
  DISAPPROVE = 'DISAPPROVE',
  FORWARD_IDS = 'FORWARD_IDS',
  DELETE = 'DELETE',
  REVERSE_TO_APPROVE = 'REVERSE_TO_APPROVE',
  REVERSE_TO_DISAPPROVE = 'REVERSE_TO_DISAPPROVE',
  SAVE_FINDINGS = 'SAVE_FINDINGS',
  RESEND = 'RESEND'
}

export interface RequestFinding {
  id: string;
  section: string;
  category: 'Wrong Choice' | 'Wrong Route' | 'Wrong Dose' | 'Wrong Duration' | 'No Infection' | 'Others';
  details: string;
  timestamp: string;
  user: string;
}

export interface PreviousAntibiotic {
  id?: string | number;
  drug: string;
  frequency: string;
  duration: string;
}

export interface Susceptibility {
  drug: string;
  result: string;
}

export interface Organism {
  id?: string | number;
  name: string;
  susceptibilities: Susceptibility[];
}

export interface Prescription {
  id: string; 
  request_number: number;
  created_at?: string;
  req_date: string;
  dispensed_date?: string; 
  ids_approved_at?: string; 
  ids_disapproved_at?: string; 
  status: PrescriptionStatus;
  notes?: string;
  
  patient_name: string;
  hospital_number: string;
  patient_dob?: string;
  ward?: string;
  age?: string;
  sex?: string;
  weight_kg?: string;
  height_cm?: string;
  mode?: 'adult' | 'pediatric';

  diagnosis?: string;
  sgpt?: string;
  scr_mgdl?: string;
  egfr_text?: string;

  antimicrobial: string;
  drug_type: DrugType;
  dose?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  
  indication?: string;
  basis_indication?: string;

  previous_antibiotics?: PreviousAntibiotic[]; 
  organisms?: Organism[]; 
  specimen?: string;

  requested_by: string;
  dispensed_by?: string; 
  resident_name?: string;
  clinical_dept?: string;
  service_resident_name?: string;
  id_specialist?: string;

  disapproved_reason?: string;
  findings?: RequestFinding[]; 
}

export interface AuditFinding {
  id: string;
  section: string;
  category: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface AMSAudit {
  id: string; 
  created_at: string;
  audit_date: string;
  auditor: string;
  area: string;
  shift: string;
  patient_hosp_no: string;
  patient_dob: string;
  patient_age_string: string;
  general_audit_note?: string; 
  
  diagnostics: any;
  history: any;
  antimicrobials: any[]; 
  microorganisms: any[];
  audit_findings?: AuditFinding[];
}

export interface TransferLog {
  date: string;
  from_ward: string;
  to_ward: string;
  from_bed: string;
  to_bed: string;
}

export interface AdminLogEntry {
  time: string;
  status: 'Given' | 'Missed';
  reason?: string;
  user?: string;
  // Added timestamp to fix type error in MonitoringDetailModal where logging time is recorded
  timestamp?: string;
}

export interface ChangeLogEntry {
  date: string;
  type: 'Dose Change' | 'Status Change';
  oldValue?: string;
  newValue?: string;
  reason?: string;
  user?: string;
}

export interface MonitoringAntimicrobial {
  id: string;
  drug_name: string;
  dose: string;
  route: string;
  frequency: string;
  frequency_hours?: number;
  administration_log?: Record<string, (string | AdminLogEntry)[]>; 
  planned_duration: string;
  start_date: string;
  requesting_resident: string;
  ids_in_charge: string;
  date_referred_ids?: string;
  culture_result?: string;
  doses_not_given?: string;
  reason_not_given?: string;
  status: 'Active' | 'Completed' | 'Stopped' | 'Shifted';
  stop_date?: string;
  completed_at?: string; 
  shifted_at?: string;
  stop_reason?: string;
  shift_reason?: string;
  sensitivity_info?: string;
  sensitivity_date?: string;
  action_by?: string; 
  change_history?: ChangeLogEntry[];
}

export interface MonitoringPatient {
  id: string; 
  created_at?: string;
  patient_name: string;
  hospital_number: string;
  ward: string;
  bed_number: string;
  age: string;
  sex: string;
  date_of_admission: string;
  latest_creatinine: string;
  egfr: string;
  infectious_diagnosis: string;
  dialysis_status: 'Yes' | 'No';
  antimicrobials: MonitoringAntimicrobial[];
  transfer_history?: TransferLog[];
  status: 'Admitted' | 'Discharged' | 'Expired';
  discharged_at?: string | null;
  last_updated_by?: string;
}
