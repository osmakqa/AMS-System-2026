
import React, { useState, useEffect, useMemo } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import PrescriptionCard from './components/PrescriptionCard';
import PrescriptionTable from './components/PrescriptionTable';
import StatsChart from './components/StatsChart';
import PasswordModal from './components/PasswordModal';
import DetailModal from './components/DetailModal';
import DisapproveModal from './components/DisapproveModal';
import ChartDetailModal from './components/ChartDetailModal';
import UserManualModal from './components/UserManualModal';
import WorkflowModal from './components/WorkflowModal'; 
import AntimicrobialRequestForm from './components/AntimicrobialRequestForm'; 
import AMSAuditForm from './components/AMSAuditForm'; 
import AMSAuditTable from './components/AMSAuditTable'; 
import AMSAuditDetailModal from './components/AMSAuditDetailModal'; 
import AMSMonitoring from './components/AMSMonitoring'; 
import { User, UserRole, Prescription, PrescriptionStatus, ActionType, DrugType, AMSAudit, MonitoringPatient } from './types';
import { 
  fetchPrescriptions, 
  updatePrescriptionStatus, 
  createPrescription,
  fetchAudits 
} from './services/dataService';
import { db } from './services/firebaseClient';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const tabsConfig: Record<UserRole, string[]> = {
  [UserRole.PHARMACIST]: ['Pending', 'History', 'AMS Monitoring', 'Data Analysis'], 
  [UserRole.IDS]: ['Pending', 'History'],
  [UserRole.AMS_ADMIN]: ['Antimicrobials', 'AMS Audit', 'Data Analysis'],
  [UserRole.RESIDENT]: ['Disapproved'],
};

const TabIcon = ({ tabName }: { tabName: string }) => {
  let path;
  switch (tabName) {
    case 'Pending':
      path = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />;
      break;
    case 'History':
      path = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 5.555A.5.5 0 0110 5v5.5a.5.5 0 01-.146.354l-3.5 3.5a.5.5 0 01-.708-.708L9.5 10.293V5.555z" clipRule="evenodd" />;
      break;
    case 'AMS Monitoring':
      path = <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />;
      break;
    case 'Data Analysis':
      path = <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />;
      break;
    case 'AMS Audit':
      path = <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />;
      break;
    case 'Disapproved':
        path = <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.415L11 9.586V6z" clipRule="evenodd" />
        break;
    default:
      path = <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        {path}
    </svg>
  );
};


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Prescription[]>([]);
  const [auditData, setAuditData] = useState<AMSAudit[]>([]); 
  const [monitoringData, setMonitoringData] = useState<MonitoringPatient[]>([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDisapproveModalOpen, setIsDisapproveModalOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState<Prescription | null>(null);
  const [pendingAction, setPendingAction] = useState<{id: string, type: ActionType, payload?: any} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isAntimicrobialRequestFormOpen, setIsAntimicrobialRequestFormOpen] = useState(false);
  
  const [requestToEdit, setRequestToEdit] = useState<Prescription | null>(null);
  
  const [isAMSAuditFormOpen, setIsAMSAuditFormOpen] = useState(false);
  const [selectedAuditToEdit, setSelectedAuditToEdit] = useState<AMSAudit | null>(null);
  const [selectedAuditForView, setSelectedAuditForView] = useState<AMSAudit | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('All'); 
  const [historyAntimicrobialFilter, setHistoryAntimicrobialFilter] = useState<string>('All');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [drugTypeFilter, setDrugTypeFilter] = useState<string>('All'); 

  // --- Real-time Listeners (Firebase Replacement) ---
  useEffect(() => {
    if (!user) return;

    // Listen for Prescriptions
    const qRequests = query(collection(db, 'requests'), orderBy('req_date', 'desc'));
    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Prescription[];
      setData(items.filter(item => item.status !== PrescriptionStatus.DELETED));
    }, (err) => {
      setDbError(err.message);
    });

    // Listen for Audits if Admin
    let unsubscribeAudits = () => {};
    if (user.role === UserRole.AMS_ADMIN) {
      const qAudits = query(collection(db, 'audits'), orderBy('audit_date', 'desc'));
      unsubscribeAudits = onSnapshot(qAudits, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AMSAudit[];
        setAuditData(items);
      });
    }

    // Listen for Monitoring Patients
    const qMonitoring = query(collection(db, 'monitoring_patients'), orderBy('created_at', 'desc'));
    const unsubscribeMonitoring = onSnapshot(qMonitoring, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as MonitoringPatient[];
      setMonitoringData(items);
    }, (err) => {
      console.error("Monitoring subscription error:", err);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeAudits();
      unsubscribeMonitoring();
    };
  }, [user]);

  const loadData = async () => {
    // With onSnapshot, loadData is mainly for initial state or manual triggers
    setLoading(true);
    const { data: result, error } = await fetchPrescriptions();
    if (error) setDbError(error);
    else setData(result.filter(item => item.status !== PrescriptionStatus.DELETED));
    setLoading(false);
  };

  const loadAudits = async () => {
    const { data: result, error } = await fetchAudits();
    if (!error) setAuditData(result);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === UserRole.IDS || loggedInUser.role === UserRole.PHARMACIST) {
      setActiveTab('Pending');
    } else if (loggedInUser.role === UserRole.RESIDENT) {
      setActiveTab('Disapproved');
    } else {
      setActiveTab('Antimicrobials');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setData([]);
    setAuditData([]);
    setMonitoringData([]);
    setDbError(null);
  };

  const handleViewDetails = (item: Prescription) => {
    setSelectedItemForView(item);
  };

  const handleActionClick = (id: string, type: ActionType, payload?: any) => {
    if (payload?.findings && (type === ActionType.DISAPPROVE || type === ActionType.APPROVE || type === ActionType.SAVE_FINDINGS)) {
        executeAction(id, type, { findings: payload.findings });
        return;
    }

    if (type === ActionType.RESEND && payload?.isEditing) {
        const itemToEdit = data.find(i => i.id === id);
        if (itemToEdit) {
            setRequestToEdit(itemToEdit);
            setIsAntimicrobialRequestFormOpen(true);
        }
        return;
    }

    switch (type) {
      case ActionType.APPROVE:
      case ActionType.REVERSE_TO_APPROVE:
      case ActionType.RESEND: 
        executeAction(id, type);
        break;
      
      case ActionType.DISAPPROVE:
      case ActionType.REVERSE_TO_DISAPPROVE:
        setPendingAction({ id, type });
        setIsDisapproveModalOpen(true);
        break;

      case ActionType.DELETE:
      case ActionType.FORWARD_IDS:
        setPendingAction({ id, type });
        setIsPasswordModalOpen(true);
        break;
    }
  };

  const handleConfirmPassword = () => {
    setIsPasswordModalOpen(false);
    if (!pendingAction) return;
    executeAction(pendingAction.id, pendingAction.type);
    setPendingAction(null);
  };

  const getCurrentUserPassword = (user: User | null) => {
    if (!user) return 'osmak123';
    if (user.role === UserRole.AMS_ADMIN) return 'ams123';
    if (user.role === UserRole.RESIDENT) return 'doctor123';
    if (user.role === UserRole.PHARMACIST) {
      const lastName = user.name.split(',')[0].trim().toLowerCase().replace(/\s/g, '');
      return `${lastName}123`;
    }
    if (user.role === UserRole.IDS) {
      const parts = user.name.trim().split(' ');
      const lastName = parts[parts.length - 1].toLowerCase();
      return `${lastName}456`;
    }
    return 'osmak123';
  };

  const handleDisapproveSubmit = async (reason: string, details: string) => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    const fullReason = reason === 'Others' && details ? `${reason}: ${details}` : reason;
    await executeAction(pendingAction.id, pendingAction.type, { disapprovedReason: fullReason });
    setIsDisapproveModalOpen(false);
    setPendingAction(null);
    setIsSubmitting(false);
  };

  const executeAction = async (id: string, type: ActionType, extraData?: any) => {
    try {
      if (!user) return;
      const updates: { [key: string]: any } = {};
      let statusToUpdate: PrescriptionStatus | null = null;
      
      if (![ActionType.FORWARD_IDS, ActionType.DELETE, ActionType.SAVE_FINDINGS, ActionType.RESEND].includes(type)) {
        if (user.role === UserRole.PHARMACIST) updates.dispensed_by = user.name;
        else if (user.role === UserRole.IDS) updates.id_specialist = user.name;
      }
      
      if (extraData?.disapprovedReason) updates.disapproved_reason = extraData.disapprovedReason;
      if (extraData?.findings) {
        updates.findings = extraData.findings;
        if (type === ActionType.DISAPPROVE && !updates.disapproved_reason) updates.disapproved_reason = "See Review Findings";
      }
      
      switch (type) {
        case ActionType.APPROVE:
        case ActionType.REVERSE_TO_APPROVE:
          statusToUpdate = PrescriptionStatus.APPROVED;
          if (user.role === UserRole.IDS) updates.ids_approved_at = new Date().toISOString();
          else updates.dispensed_date = new Date().toISOString();
          break;
        case ActionType.DISAPPROVE:
        case ActionType.REVERSE_TO_DISAPPROVE:
          statusToUpdate = PrescriptionStatus.DISAPPROVED;
          if (user.role === UserRole.IDS) updates.ids_disapproved_at = new Date().toISOString();
          else updates.dispensed_date = new Date().toISOString();
          break;
        case ActionType.FORWARD_IDS:
          statusToUpdate = PrescriptionStatus.FOR_IDS_APPROVAL;
          updates.dispensed_by = user.name; 
          updates.dispensed_date = new Date().toISOString();
          break;
        case ActionType.DELETE:
          statusToUpdate = PrescriptionStatus.DELETED;
          break;
        case ActionType.RESEND:
          statusToUpdate = PrescriptionStatus.PENDING;
          updates.ids_approved_at = null; updates.ids_disapproved_at = null;
          updates.dispensed_date = null; updates.disapproved_reason = null; 
          break;
      }

      await updatePrescriptionStatus(id, statusToUpdate, updates);
    } catch (err: any) {
      alert(`Error: Action could not be completed. Details: ${err.message}`);
    }
  };

  const handleFormSubmission = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (formData.id) {
          await updatePrescriptionStatus(formData.id, PrescriptionStatus.PENDING, formData);
          alert("Request Updated and Resent successfully!");
      } else {
          await createPrescription(formData); 
          alert("Antimicrobial Request submitted successfully!");
      }
      setIsAntimicrobialRequestFormOpen(false);
      setRequestToEdit(null); 
    } catch (err: any) {
      alert(`Failed to submit request: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMatches = (itemStatus: string, targetStatus: PrescriptionStatus) => {
    return itemStatus?.toLowerCase().trim() === targetStatus.toLowerCase();
  };

  const getFilteredDataForCurrentView = () => {
    let items = data;
    if (user?.role === UserRole.RESIDENT || activeTab !== 'Pending') {
      items = items.filter(item => {
        const itemDate = item.req_date ? new Date(item.req_date) : new Date(item.created_at || Date.now());
        const monthMatch = selectedMonth === -1 || itemDate.getMonth() === selectedMonth;
        const yearMatch = selectedYear === 0 || itemDate.getFullYear() === selectedYear;
        return monthMatch && yearMatch;
      });
    }

    if (activeTab === 'History') {
      // Common History logic for Pharmacist and IDS
      if (user?.role === UserRole.PHARMACIST) {
        if (historyStatusFilter === 'All') items = items.filter(i => !statusMatches(i.status, PrescriptionStatus.PENDING));
        else if (historyStatusFilter === 'Approved') items = items.filter(i => statusMatches(i.status, PrescriptionStatus.APPROVED) && i.drug_type === DrugType.MONITORED);
        else if (historyStatusFilter === 'Disapproved') items = items.filter(i => statusMatches(i.status, PrescriptionStatus.DISAPPROVED));
        else if (historyStatusFilter === 'For IDS Approval') items = items.filter(i => statusMatches(i.status, PrescriptionStatus.FOR_IDS_APPROVAL));
        else if (historyStatusFilter === 'Approved by ID') items = items.filter(i => statusMatches(i.status, PrescriptionStatus.APPROVED) && i.drug_type === DrugType.RESTRICTED);
        else items = [];
      } else if (user?.role === UserRole.IDS) {
        items = items.filter(i => i.id_specialist === user.name);
        if (historyStatusFilter === 'Approved') items = items.filter(i => statusMatches(i.status, PrescriptionStatus.APPROVED) && i.drug_type === DrugType.RESTRICTED);
        else if (historyStatusFilter === 'Disapproved') items = items.filter(i => statusMatches(i.status, PrescriptionStatus.DISAPPROVED) && i.drug_type === DrugType.RESTRICTED);
        else items = [];
      }

      // Apply Search Filter
      if (historySearchQuery) {
        const q = historySearchQuery.toLowerCase().trim();
        items = items.filter(i => 
            i.patient_name.toLowerCase().includes(q) || 
            i.hospital_number.toLowerCase().includes(q) ||
            i.antimicrobial.toLowerCase().includes(q) ||
            (i.req_date && new Date(i.req_date).toLocaleDateString().toLowerCase().includes(q))
        );
      }

      // Apply Antimicrobial Filter
      if (historyAntimicrobialFilter !== 'All') {
        items = items.filter(i => i.antimicrobial === historyAntimicrobialFilter);
      }

      return items;
    }
    
    if (user?.role === UserRole.PHARMACIST) {
      switch (activeTab) {
        case 'Pending': return items.filter(i => statusMatches(i.status, PrescriptionStatus.PENDING));
      }
    }
    
    if (user?.role === UserRole.IDS) {
      switch (activeTab) {
        case 'Pending': 
          return items.filter(i => i.id_specialist === user.name && statusMatches(i.status, PrescriptionStatus.FOR_IDS_APPROVAL));
      }
    }
    
    if (user?.role === UserRole.AMS_ADMIN) {
      switch (activeTab) {
        case 'Data Analysis': return data; 
        case 'Antimicrobials': return items;
        case 'AMS Audit': return []; 
      }
    }

    if (user?.role === UserRole.RESIDENT && activeTab === 'Disapproved') {
        return items.filter(i => statusMatches(i.status, PrescriptionStatus.DISAPPROVED));
    }

    return items;
  };
  
  const FilterHeader = () => {
    const showFilters = user?.role === UserRole.RESIDENT || 
        (user?.role !== UserRole.AMS_ADMIN && activeTab !== 'Pending' && activeTab !== 'Data Analysis' && activeTab !== 'AMS Monitoring') || 
        (user?.role === UserRole.AMS_ADMIN && (activeTab !== 'Data Analysis' && activeTab !== 'AMS Audit'));

    if (!showFilters) return null;

    const uniqueAntimicrobials = Array.from(new Set(data.map(i => i.antimicrobial))).sort();

    return (
      <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
                </h3>
                {activeTab === 'History' && (
                    <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Status:</label>
                        <select
                            value={historyStatusFilter}
                            onChange={(e) => setHistoryStatusFilter(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none [color-scheme:light]"
                        >
                            {user?.role === UserRole.PHARMACIST ? (
                              <>
                                <option value="All">All Actions</option>
                                <option value="Approved">Approved (Monitored)</option>
                                <option value="Disapproved">Disapproved</option>
                                <option value="For IDS Approval">For IDS Approval</option>
                                <option value="Approved by ID">Approved by ID</option>
                              </>
                            ) : (
                              <>
                                <option value="Approved">Approved</option>
                                <option value="Disapproved">Disapproved</option>
                              </>
                            )}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Month:</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none shadow-sm [color-scheme:light]"><option value={-1}>All Months</option>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Year:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none shadow-sm [color-scheme:light]"><option value={0}>All Years</option>{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </div>
        </div>

        {/* Search and Advanced Filters for History Tab */}
        {activeTab === 'History' && (
             <div className="flex flex-col md:flex-row gap-4 pt-3 border-t border-gray-100">
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        placeholder="Search patient, hospital ID, drug, or date..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Drug:</label>
                    <select
                        value={historyAntimicrobialFilter}
                        onChange={(e) => setHistoryAntimicrobialFilter(e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none [color-scheme:light]"
                    >
                        <option value="All">All Antimicrobials</option>
                        {uniqueAntimicrobials.map(drug => <option key={drug} value={drug}>{drug}</option>)}
                    </select>
                </div>
             </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (dbError) {
      return (
        <div className="p-12 bg-white rounded-lg shadow-md border-l-4 border-red-500 my-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Database Error</h3>
          <p className="bg-red-50 p-4 rounded border border-red-100 font-mono text-sm break-words">{dbError}</p>
        </div>
      );
    }

    if (activeTab === 'AMS Audit' && user?.role === UserRole.AMS_ADMIN) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">AMS Audit Dashboard</h2>
                        <p className="text-sm text-gray-500">Create new audits and review existing audit logs.</p>
                    </div>
                    <button onClick={() => { setSelectedAuditToEdit(null); setIsAMSAuditFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>New Audit</button>
                </div>
                <AMSAuditTable items={auditData} onView={(audit) => setSelectedAuditForView(audit)} onEdit={(audit) => { setSelectedAuditToEdit(audit); setIsAMSAuditFormOpen(true); }} />
            </div>
        );
    }

    if (activeTab === 'AMS Monitoring') return <AMSMonitoring user={user} />;

    const viewData = getFilteredDataForCurrentView();

    if (activeTab === 'Pending' || (user?.role === UserRole.RESIDENT && activeTab === 'Disapproved')) {
        const titleMap: any = { PHARMACIST: 'Pending Requests', IDS: 'Pending for IDS Approval', RESIDENT: 'Disapproved Requests' };
        return (
          <div>
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div><h2 className="text-xl font-bold text-gray-800">{titleMap[user!.role]}</h2><p className="text-sm text-gray-500">Total: {viewData.length}</p></div>
                {user?.role === UserRole.PHARMACIST && (<button onClick={() => { setRequestToEdit(null); setIsAntimicrobialRequestFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>New Request</button>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewData.length === 0 ? <p className="col-span-full text-center py-10 bg-white rounded-lg">No items found.</p> : viewData.map(item => (
                <PrescriptionCard key={item.id} item={item} role={user!.role} onAction={handleActionClick} onView={handleViewDetails} />
              ))}
            </div>
          </div>
        );
    }

    switch(activeTab) {
      case 'History':
        let tableStatusType: PrescriptionStatus | 'ALL_VIEW' = 'ALL_VIEW';
        if (historyStatusFilter === 'Approved') tableStatusType = PrescriptionStatus.APPROVED;
        if (historyStatusFilter === 'Disapproved') tableStatusType = PrescriptionStatus.DISAPPROVED;
        if (historyStatusFilter === 'For IDS Approval') tableStatusType = PrescriptionStatus.FOR_IDS_APPROVAL;
        return <PrescriptionTable items={viewData} onAction={handleActionClick} onView={handleViewDetails} statusType={tableStatusType} isHistoryView={true} />;
      case 'Data Analysis':
        return <StatsChart data={data} allData={data} auditData={auditData} monitoringData={monitoringData} role={user?.role} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} selectedYear={selectedYear} onYearChange={setSelectedYear} />;
      case 'Antimicrobials':
         let displayData = viewData;
         if (drugTypeFilter === 'Monitored') displayData = viewData.filter(i => i.drug_type === DrugType.MONITORED);
         else if (drugTypeFilter === 'Restricted') displayData = viewData.filter(i => i.drug_type === DrugType.RESTRICTED);
         return (
           <div className="space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
               <h3 className="text-lg font-bold text-gray-700">{activeTab} Requests</h3>
               <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                       <span className="text-xs font-semibold text-gray-500 uppercase">Drug Type:</span>
                       <select value={drugTypeFilter} onChange={(e) => setDrugTypeFilter(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none [color-scheme:light]"><option value="All">All</option><option value="Monitored">Monitored</option><option value="Restricted">Restricted</option></select>
                   </div>
               </div>
             </div>
             <PrescriptionTable items={displayData} onAction={handleActionClick} onView={handleViewDetails} statusType={'ALL_VIEW'} />
           </div>
         );
      default: return null;
    }
  };
  
  const currentTabs = user ? tabsConfig[user.role] : tabsConfig[UserRole.PHARMACIST]; 

  return (
    <>
      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />
      <WorkflowModal isOpen={isWorkflowModalOpen} onClose={() => setIsWorkflowModalOpen(false)} />
      <AntimicrobialRequestForm isOpen={isAntimicrobialRequestFormOpen} onClose={() => { setIsAntimicrobialRequestFormOpen(false); setRequestToEdit(null); }} onSubmit={handleFormSubmission} loading={isSubmitting} initialData={requestToEdit} />
      <AMSAuditForm isOpen={isAMSAuditFormOpen} initialData={selectedAuditToEdit} onClose={() => { setIsAMSAuditFormOpen(false); setSelectedAuditToEdit(null); }} />
      <AMSAuditDetailModal isOpen={!!selectedAuditForView} onClose={() => setSelectedAuditForView(null)} audit={selectedAuditForView} onSave={loadAudits} />

      {!user ? (
        <Login onLogin={handleLogin} onOpenManual={() => setIsUserManualOpen(false)} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} onOpenAntimicrobialRequestForm={() => { setRequestToEdit(null); setIsAntimicrobialRequestFormOpen(true); }} onOpenAuditForm={() => { setSelectedAuditToEdit(null); setIsAMSAuditFormOpen(true); }} />
      ) : (
        <>
          <Layout user={user} onLogout={handleLogout} tabs={currentTabs} activeTab={activeTab} onTabChange={(tab) => { 
              setActiveTab(tab); 
              if(tab === 'History') {
                setHistoryStatusFilter(user?.role === UserRole.PHARMACIST ? 'All' : 'Approved');
                setHistoryAntimicrobialFilter('All');
                setHistorySearchQuery('');
              }
          }}>
            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onConfirm={handleConfirmPassword} expectedPassword={getCurrentUserPassword(user)} />
            <DisapproveModal isOpen={isDisapproveModalOpen} onClose={() => setIsDisapproveModalOpen(false)} onSubmit={handleDisapproveSubmit} loading={isSubmitting} />
            <DetailModal isOpen={!!selectedItemForView} onClose={() => setSelectedItemForView(null)} item={selectedItemForView} role={user.role} userName={user.name} onAction={handleActionClick} />
            <div className="pb-20 md:pb-0">{FilterHeader()}{renderContent()}</div>
          </Layout>
          <div className="fixed bottom-0 left-0 right-0 bg-[#009a3e] p-2 z-40 md:hidden flex overflow-x-auto gap-2 justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            {currentTabs.map((tab) => (
              <button key={tab} onClick={() => { 
                  setActiveTab(tab); 
                  if(tab === 'History') {
                    setHistoryStatusFilter(user?.role === UserRole.PHARMACIST ? 'All' : 'Approved');
                    setHistoryAntimicrobialFilter('All');
                    setHistorySearchQuery('');
                  }
              }} className={`whitespace-nowrap px-2 py-1.5 font-medium text-xs transition-all duration-200 rounded-lg flex flex-col items-center flex-1 ${activeTab === tab ? 'bg-white text-[#009a3e] shadow-md' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}><span className="mb-0.5"><TabIcon tabName={tab} /></span>{tab}</button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default App;
