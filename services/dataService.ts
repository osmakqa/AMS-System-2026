
import { db } from './firebaseClient';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  where,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { Prescription, PrescriptionStatus, AMSAudit, MonitoringPatient } from '../types';
import { GOOGLE_SHEET_WEB_APP_URL } from '../constants';

/**
 * Backup to Google Sheets
 */
const sendToGoogleSheet = async (sheetName: string, data: any) => {
  if (!GOOGLE_SHEET_WEB_APP_URL) return;

  const flatData: Record<string, any> = {};
  if (data && typeof data === 'object') {
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === undefined) {
        flatData[key] = null;
      } else if (typeof value === 'object' && value !== null) {
        flatData[key] = JSON.stringify(value);
      } else {
        flatData[key] = value;
      }
    });
  } else {
    Object.assign(flatData, data);
  }

  try {
    await fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ sheetName, record: flatData }),
    });
  } catch (error) {
    console.error(`Google Sheet backup error:`, error);
  }
};

// --- PRESCRIPTION FUNCTIONS ---

export const fetchPrescriptions = async (): Promise<{ data: Prescription[], error: string | null }> => {
  try {
    const q = query(collection(db, 'requests'), orderBy('req_date', 'desc'));
    const querySnapshot = await getDocs(q);
    const prescriptions = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Prescription[];
    return { data: prescriptions, error: null };
  } catch (err: any) {
    console.error('Firebase fetch error:', err);
    return { data: [], error: err.message };
  }
};

export const updatePrescriptionStatus = async (
  id: string, 
  status: PrescriptionStatus | null | undefined, 
  updates: { [key: string]: any }
) => {
  const docRef = doc(db, 'requests', id);
  const payload = { ...updates };
  if (status) payload.status = status;

  try {
    await updateDoc(docRef, payload);
    
    // Backup
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      sendToGoogleSheet("Prescriptions", { ...updatedDoc.data(), id: id });
    }
  } catch (err: any) {
    console.error('Update error:', err);
    throw err;
  }
};

export const deletePrescription = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'requests', id));
    sendToGoogleSheet("Prescriptions_Deleted", { id: id, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('Delete error:', err);
    throw err;
  }
};

export const createPrescription = async (prescription: Partial<Prescription>) => {
  try {
    // Determine the next request number
    const q = query(collection(db, 'requests'), orderBy('request_number', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    let nextNum = 1;
    if (!snapshot.empty) {
        const lastEntry = snapshot.docs[0].data() as Prescription;
        if (lastEntry.request_number) {
            nextNum = lastEntry.request_number + 1;
        }
    }

    const docRef = await addDoc(collection(db, 'requests'), {
      ...prescription,
      request_number: nextNum,
      created_at: new Date().toISOString()
    });
    
    const newDoc = await getDoc(docRef);
    if (newDoc.exists()) {
      sendToGoogleSheet("Prescriptions", { ...newDoc.data(), id: docRef.id });
    }
  } catch (err: any) {
    console.error('Create error:', err);
    throw err;
  }
};

// --- AUDIT FUNCTIONS ---

export const fetchAudits = async (): Promise<{ data: AMSAudit[], error: string | null }> => {
  try {
    const q = query(collection(db, 'audits'), orderBy('audit_date', 'desc'));
    const querySnapshot = await getDocs(q);
    const audits = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AMSAudit[];
    return { data: audits, error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
};

export const createAudit = async (audit: Partial<AMSAudit>) => {
  try {
    const docRef = await addDoc(collection(db, 'audits'), {
      ...audit,
      created_at: new Date().toISOString()
    });
    const newDoc = await getDoc(docRef);
    if (newDoc.exists()) {
      sendToGoogleSheet("Audits", { ...newDoc.data(), id: docRef.id });
    }
  } catch (err: any) {
    console.error('Create Audit error:', err);
    throw err;
  }
};

export const updateAudit = async (id: string, audit: Partial<AMSAudit>) => {
  try {
    const docRef = doc(db, 'audits', id);
    await updateDoc(docRef, audit);
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      sendToGoogleSheet("Audits", { ...updatedDoc.data(), id: id });
    }
  } catch (err: any) {
    console.error('Update Audit error:', err);
    throw err;
  }
};

// --- MONITORING FUNCTIONS ---

export const fetchAllMonitoringPatients = async (): Promise<{ data: MonitoringPatient[], error: string | null }> => {
  try {
    const q = query(collection(db, 'monitoring_patients'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const patients = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as MonitoringPatient[];
    return { data: patients, error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
};

export const createMonitoringPatient = async (patient: Partial<MonitoringPatient>) => {
  try {
    const docRef = await addDoc(collection(db, 'monitoring_patients'), {
      ...patient,
      created_at: new Date().toISOString()
    });
    const newDoc = await getDoc(docRef);
    if (newDoc.exists()) {
      sendToGoogleSheet("Monitoring", { ...newDoc.data(), id: docRef.id });
    }
    return { ...newDoc.data(), id: docRef.id };
  } catch (err: any) {
    console.error('Create Monitoring Patient error:', err);
    throw err;
  }
};

export const updateMonitoringPatient = async (id: string, updates: Partial<MonitoringPatient>) => {
  try {
    const docRef = doc(db, 'monitoring_patients', id);
    await updateDoc(docRef, updates);
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      sendToGoogleSheet("Monitoring", { ...updatedDoc.data(), id: id });
    }
  } catch (err: any) {
    console.error('Update Monitoring Patient error:', err);
    throw err;
  }
};
