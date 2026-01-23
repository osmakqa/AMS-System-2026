
import React, { useState, useEffect, useMemo } from 'react';
import { MonitoringPatient, User, MonitoringAntimicrobial, AdminLogEntry } from '../types';
import { updateMonitoringPatient } from '../services/dataService';
import { db } from '../services/firebaseClient';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import MonitoringDetailModal from './MonitoringDetailModal';
import AddPatientModal from './AddPatientModal';
import EditPatientModal from './EditPatientModal';
import { WARDS } from '../constants';

interface AMSMonitoringProps {
    user: User | null;
}

const KpiIcon = ({ path }: { path: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">{path}</svg>;

const KpiCard = ({ title, value, subValue, icon, iconColor, isActive, onClick }: { title: string, value: string | number, subValue?: string, icon: React.ReactNode, iconColor: string, isActive: boolean, onClick?: () => void }) => (
    <div onClick={onClick} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isActive ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200 shadow-md' : 'bg-white border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300'}`}>
      <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${iconColor}`}>{icon}</div>
      <div><p className="text-xl font-bold text-black">{value}</p><p className="text-xs text-gray-500 font-medium">{title}</p>{subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}</div>
    </div>
);

const normalizeLogEntry = (entry: string | AdminLogEntry | null): AdminLogEntry | null => {
    if (!entry) return null;
    return typeof entry === 'string' ? { time: entry, status: 'Given' } : entry;
};

const calculateDayOfTherapy = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0); 
    now.setHours(0, 0, 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))) + 1;
};

const getMaxTherapyDays = (patient: MonitoringPatient) => {
    let maxDays = 0;
    if (!patient.antimicrobials) return 0;
    patient.antimicrobials.forEach(drug => { 
        if (drug && drug.status === 'Active') { 
            const days = calculateDayOfTherapy(drug.start_date); 
            if (days > maxDays) maxDays = days; 
        } 
    });
    return maxDays;
};

const AMSMonitoring: React.FC<AMSMonitoringProps> = ({ user }) => {
  const [patients, setPatients] = useState<MonitoringPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState<MonitoringPatient[]>([]);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('Admitted');
  const [searchQuery, setSearchQuery] = useState('');
  const [kpiFilter, setKpiFilter] = useState<'All' | 'RedFlag' | 'New' | 'NearingStop'>('All');
  const [sortConfig] = useState<{ key: keyof MonitoringPatient | 'days_on_therapy', direction: 'asc' | 'desc' }>({ key: 'patient_name', direction: 'asc' });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientIdInView, setSelectedPatientIdInView] = useState<string | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<MonitoringPatient | null>(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'monitoring_patients'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as MonitoringPatient[];
      setPatients(items);
      setLoading(false);
    }, (err) => {
      console.error("Firestore monitor error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Derive the current patient in view from the live patients list
  const patientInView = useMemo(() => {
    if (!selectedPatientIdInView) return null;
    return patients.find(p => p.id === selectedPatientIdInView) || null;
  }, [patients, selectedPatientIdInView]);

  const getRedFlagStatus = (patient: MonitoringPatient) => {
    if (!patient.antimicrobials) return { hasMissedDoses: false, hasRenalAlert: false, hasProlongedTherapy: false };
    const hasMissedDoses = patient.antimicrobials.some(drug => 
        drug && Object.values(drug.administration_log || {}).flat().some((entry: any) => normalizeLogEntry(entry)?.status === 'Missed')
    );
    const hasRenalAlert = patient.egfr && parseFloat(patient.egfr) < 30;
    const hasProlongedTherapy = patient.antimicrobials.some(drug => drug && drug.status === 'Active' && calculateDayOfTherapy(drug.start_date) > 14);
    return { hasMissedDoses, hasRenalAlert, hasProlongedTherapy };
  };

  const kpiStats = useMemo(() => {
    const active = patients.filter(p => p && p.status === 'Admitted');
    const redFlagPatients = active.filter(p => { const f = getRedFlagStatus(p); return f.hasMissedDoses || f.hasRenalAlert || f.hasProlongedTherapy; });
    const now = Date.now();
    const newPatients = active.filter(p => {
        const t = p.created_at ? new Date(p.created_at).getTime() : 0;
        return t > 0 && (now - t) < 86400000;
    });
    const nearingCompletion = active.filter(p => p.antimicrobials?.some(drug => {
        if (!drug || !drug.planned_duration || drug.status !== 'Active') return false;
        const diff = parseInt(drug.planned_duration) - calculateDayOfTherapy(drug.start_date);
        return diff >= 0 && diff <= 2;
    }));
    return { activeCount: active.length, redFlagCount: redFlagPatients.length, newCount: newPatients.length, nearingStopCount: nearingCompletion.length };
  }, [patients]);

  useEffect(() => {
    let result = patients.filter(p => p && p.status === statusFilter);
    if (kpiFilter === 'RedFlag') result = result.filter(p => { const f = getRedFlagStatus(p); return f.hasMissedDoses || f.hasRenalAlert || f.hasProlongedTherapy; });
    else if (kpiFilter === 'New') {
        const now = Date.now();
        result = result.filter(p => {
            const t = p.created_at ? new Date(p.created_at).getTime() : 0;
            return t > 0 && (now - t) < 86400000;
        });
    }
    else if (kpiFilter === 'NearingStop') result = result.filter(p => p.antimicrobials?.some(drug => drug && drug.planned_duration && drug.status === 'Active' && (parseInt(drug.planned_duration) - calculateDayOfTherapy(drug.start_date) <= 2)));
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.patient_name.toLowerCase().includes(q) || p.hospital_number.toLowerCase().includes(q));
    }
    setFilteredPatients(result);
  }, [patients, statusFilter, searchQuery, kpiFilter]);

  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      let av = sortConfig.key === 'days_on_therapy' ? getMaxTherapyDays(a) : (a[sortConfig.key as keyof MonitoringPatient] as any) || '';
      let bv = sortConfig.key === 'days_on_therapy' ? getMaxTherapyDays(b) : (b[sortConfig.key as keyof MonitoringPatient] as any) || '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortConfig.direction === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
  }, [filteredPatients, sortConfig]);

  return (
    <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-black">AMS Monitoring Dashboard</h2><p className="text-sm text-gray-500">Real-time antimicrobial surveillance.</p></div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>Add Patient</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Active Patients" value={kpiStats.activeCount} isActive={kpiFilter === 'All'} iconColor="bg-blue-600 text-white" icon={<KpiIcon path="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />} onClick={() => setKpiFilter('All')} />
            <KpiCard title="Red Flags" value={kpiStats.redFlagCount} isActive={kpiFilter === 'RedFlag'} iconColor="bg-red-600 text-white" icon={<KpiIcon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} onClick={() => setKpiFilter('RedFlag')} />
            <KpiCard title="New (24h)" value={kpiStats.newCount} isActive={kpiFilter === 'New'} iconColor="bg-green-600 text-white" icon={<KpiIcon path="M10 3a1 1 0 011 1v5h5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />} onClick={() => setKpiFilter('New')} />
            <KpiCard title="Nearing End" value={kpiStats.nearingStopCount} subValue="Next 48h" isActive={kpiFilter === 'NearingStop'} iconColor="bg-yellow-50 text-yellow-700" icon={<KpiIcon path="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" />} onClick={() => setKpiFilter('NearingStop')} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ward/Bed</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">DOT</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Active Therapy</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedPatients.map(p => {
                            const flags = getRedFlagStatus(p);
                            const dot = getMaxTherapyDays(p);
                            return (
                                <tr 
                                  key={p.id} 
                                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                  onClick={() => setSelectedPatientIdInView(p.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-black group-hover:text-blue-700 transition-colors">{p.patient_name}</div>
                                            {(flags.hasMissedDoses || flags.hasRenalAlert || flags.hasProlongedTherapy) && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Red Flag" />}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{p.hospital_number}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-black">{p.ward} • {p.bed_number}</td>
                                    <td className="px-6 py-4 font-bold text-sm text-gray-700">{dot > 0 ? `Day ${dot}` : '-'}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex flex-wrap gap-1">
                                            {p.antimicrobials?.filter(a => a && a.status === 'Active').map((a, i) => <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">{a.drug_name}</span>)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setSelectedPatientForEdit(p)} className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-white border border-gray-100 transition-colors" title="Edit Patient Details">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => setSelectedPatientIdInView(p.id)} className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-white border border-gray-100 transition-colors" title="View Full Details">
                                                <KpiIcon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {isAddModalOpen && <AddPatientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} user={user} onSuccess={() => setIsAddModalOpen(false)} />}
        {patientInView && <MonitoringDetailModal isOpen={!!patientInView} onClose={() => setSelectedPatientIdInView(null)} patient={patientInView} user={user} onUpdate={() => {}} />}
        {selectedPatientForEdit && <EditPatientModal isOpen={!!selectedPatientForEdit} onClose={() => setSelectedPatientForEdit(null)} patient={selectedPatientForEdit} user={user} />}
    </div>
  );
};

export default AMSMonitoring;
