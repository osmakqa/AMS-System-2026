
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Prescription, PrescriptionStatus, DrugType, AMSAudit, MonitoringPatient, AdminLogEntry } from '../types';
import ChartDetailModal from './ChartDetailModal';
import { IDS_SPECIALISTS, PHARMACISTS } from '../constants';

interface StatsChartProps {
  data: Prescription[];
  allData: Prescription[];
  auditData?: AMSAudit[]; 
  monitoringData?: MonitoringPatient[];
  role?: string;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

// Helper to normalize and match IDS names, handling common spelling variations
const isIdsNameMatch = (name1: string | undefined | null, name2: string | undefined | null) => {
    if (!name1 || !name2) return false;
    const clean1 = name1.toLowerCase().trim();
    const clean2 = name2.toLowerCase().trim();
    if (clean1 === clean2) return true;

    // Specific legacy mapping for Dr. Tibayan (Christopher vs Christoper)
    const tibayanVariants = ["dr. christopher john tibayan", "dr. christoper john tibayan"];
    if (tibayanVariants.includes(clean1) && tibayanVariants.includes(clean2)) {
        return true;
    }

    return false;
};

// Canonical name for Tibayan for stats aggregation
const getCanonicalIdsName = (name: string | undefined | null) => {
    if (!name) return name;
    const clean = name.toLowerCase().trim();
    const tibayanVariants = ["dr. christopher john tibayan", "dr. christoper john tibayan"];
    if (tibayanVariants.includes(clean)) return "Dr. Christoper John Tibayan";
    return name;
};

// --- Data Processing Helpers ---
const getTopN = (items: (string | undefined)[], n: number, useCanonicalIds: boolean = false) => {
  const counts = new Map<string, number>();
  items.forEach(item => { 
      if (item) { 
          const nameToUse = useCanonicalIds ? getCanonicalIdsName(item) : item;
          if (nameToUse) counts.set(nameToUse, (counts.get(nameToUse) || 0) + 1); 
      } 
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
};

const formatDuration = (ms: number) => {
  if (isNaN(ms) || ms <= 0) return 'N/A';
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${(hours * 60).toFixed(0)} min`;
  if (hours < 48) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
};

const normalizeLogEntry = (entry: string | AdminLogEntry | null): AdminLogEntry | null => {
    if (!entry) return null;
    if (typeof entry === 'string') return { time: entry, status: 'Given' };
    return entry;
};

// --- Reusable UI Components ---
const ChartWrapper = ({ title, children, onClick }: { title: string, children?: React.ReactNode, onClick?: () => void }) => (
  <div 
    className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-[400px] flex flex-col transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:border-green-300 hover:-translate-y-1' : ''}`}
    onClick={onClick}
  >
    <h3 className="text-md font-bold text-gray-800 mb-4">{title}</h3>
    <div className="flex-grow w-full h-full">{children}</div>
  </div>
);

const KpiCard = ({ title, value, subValue, icon, color, onClick }: { title: string, value: string | number, subValue?: string, icon: React.ReactNode, color: string, onClick?: () => void }) => (
  <div className={`bg-white p-5 rounded-xl shadow-lg border border-gray-200 flex items-center gap-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:border-green-300 hover:-translate-y-1' : ''}`} onClick={onClick}>
    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${color}`}>{icon}</div>
    <div className="overflow-hidden">
      <p className="text-2xl font-bold text-gray-800 truncate">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  </div>
);

const Top5List = ({ title, data, color, icon, onClick }: { title: string, data: { name: string, value: number }[], color: string, icon: React.ReactNode, onClick?: () => void }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:border-green-300 hover:-translate-y-1' : ''}`} onClick={onClick}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
            <h3 className="text-md font-bold text-gray-800">{title}</h3>
        </div>
        <div className="space-y-3">
            {data.length > 0 ? data.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                    <span className="text-sm font-medium text-gray-700 truncate">{index + 1}. {item.name}</span>
                    <span className={`text-sm font-bold text-white px-2 py-0.5 rounded-full ${color}`}>{item.value}</span>
                </div>
            )) : <NoDataDisplay />}
        </div>
    </div>
);

const NoDataDisplay = () => <div className="flex items-center justify-center h-full text-gray-400">No data for this period.</div>;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-sm"><p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (<div key={index} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div><span>{`${entry.name}: ${entry.value}`}</span></div>))}
      </div>);
  }
  return null;
};

const FilterControls = ({ selectedMonth, onMonthChange, selectedYear, onYearChange }: any) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Month:</label>
        <select 
          value={selectedMonth} 
          onChange={(e) => onMonthChange(parseInt(e.target.value))} 
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none shadow-sm transition-colors hover:border-gray-400 [color-scheme:light]"
        >
          <option value={-1}>All Months</option>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Year:</label>
        <select 
          value={selectedYear} 
          onChange={(e) => onYearChange(parseInt(e.target.value))} 
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none shadow-sm transition-colors hover:border-gray-400 [color-scheme:light]"
        >
          <option value={0}>All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
};


// --- Main Component ---
const StatsChart: React.FC<StatsChartProps> = ({ data, allData, auditData = [], monitoringData = [], role, selectedMonth, onMonthChange, selectedYear, onYearChange }) => {
  const [activeTab, setActiveTab] = useState('General');
  const [modeFilter, setModeFilter] = useState<'All' | 'adult' | 'pediatric'>('All');
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; data: Prescription[]; title: string }>({ isOpen: false, data: [], title: '' });
  
  const handleModalClose = () => setModalConfig({ isOpen: false, data: [], title: '' });
  
  const filteredMonitoringData = useMemo(() => {
    return monitoringData.filter(item => {
        const d = item.created_at ? new Date(item.created_at) : new Date();
        const mMatch = selectedMonth === -1 || d.getMonth() === selectedMonth;
        const yMatch = selectedYear === 0 || d.getFullYear() === selectedYear;
        return mMatch && yMatch;
    });
  }, [monitoringData, selectedMonth, selectedYear]);

  const processedMonitoring = useMemo(() => {
    const activePatients = filteredMonitoringData.filter(p => p.status === 'Admitted');
    const allTherapies = filteredMonitoringData.flatMap(p => p.antimicrobials || []);
    const activeTherapies = allTherapies.filter(t => t.status === 'Active');
    
    // Outcomes breakdown
    const outcomes = [
        { name: 'Active', value: allTherapies.filter(t => t.status === 'Active').length },
        { name: 'Completed', value: allTherapies.filter(t => t.status === 'Completed').length },
        { name: 'Stopped', value: allTherapies.filter(t => t.status === 'Stopped').length },
        { name: 'Shifted', value: allTherapies.filter(t => t.status === 'Shifted').length },
    ];

    // Missed dose reason analysis
    const missedReasonsMap = new Map<string, number>();
    let totalMissed = 0;
    allTherapies.forEach(drug => {
        Object.values(drug.administration_log || {}).forEach((dayDoses: any[]) => {
            dayDoses.forEach(entry => {
                const e = normalizeLogEntry(entry);
                if (e?.status === 'Missed') {
                    totalMissed++;
                    const reason = e.reason || 'Not Specified';
                    missedReasonsMap.set(reason, (missedReasonsMap.get(reason) || 0) + 1);
                }
            });
        });
    });
    
    const missedReasons = Array.from(missedReasonsMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    // Days on Therapy (DOT) distribution
    const dotData: number[] = activeTherapies.map(t => {
        const start = new Date(t.start_date);
        const diff = Date.now() - start.getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    });
    const avgDot = dotData.length > 0 ? (dotData.reduce((a,b) => a+b, 0) / dotData.length).toFixed(1) : '0';

    return {
        activePatients: activePatients.length,
        totalMissed,
        completedCount: allTherapies.filter(t => t.status === 'Completed').length,
        avgDot,
        outcomes,
        missedReasons,
        topMonitoringDrugs: getTopN(allTherapies.map(t => t.drug_name), 5)
    };
  }, [filteredMonitoringData]);

  const modeFilteredData = useMemo(() => {
    let filtered = data;
    
    // Apply Date Filter
    filtered = filtered.filter(item => {
      const d = item.req_date ? new Date(item.req_date) : new Date(item.created_at || Date.now());
      const mMatch = selectedMonth === -1 || d.getMonth() === selectedMonth;
      const yMatch = selectedYear === 0 || d.getFullYear() === selectedYear;
      return mMatch && yMatch;
    });

    if (modeFilter === 'All') return filtered;
    return filtered.filter(d => d.mode === modeFilter);
  }, [data, modeFilter, selectedMonth, selectedYear]);

  // --- Audit Data Processing ---
  const processedAuditData = useMemo(() => {
    let audits = auditData;
    
    // Filter Audits by Date
    audits = audits.filter(item => {
      const d = new Date(item.audit_date);
      const mMatch = selectedMonth === -1 || d.getMonth() === selectedMonth;
      const yMatch = selectedYear === 0 || d.getFullYear() === selectedYear;
      return mMatch && yMatch;
    });

    // Extract all antimicrobial entries from all filtered audits
    const allAbxEntries = audits.flatMap(a => (a.antimicrobials || []).map(drug => ({ ...drug, auditor: a.auditor, auditId: a.id })));
    
    const totalAudits = audits.length;
    const totalAbx = allAbxEntries.length;

    // Compliance Metrics
    const guidelinesYes = allAbxEntries.filter(a => (a as any).guidelinesCompliance === 'Yes').length;
    const reasonYes = allAbxEntries.filter(a => (a as any).reasonInNote === 'Yes').length;
    const stopYes = allAbxEntries.filter(a => (a as any).stopReviewDocumented === 'Yes').length;

    const complianceData = [
        { name: 'Guidelines', value: totalAbx > 0 ? (guidelinesYes / totalAbx) * 100 : 0, count: guidelinesYes },
        { name: 'Reason in Note', value: totalAbx > 0 ? (reasonYes / totalAbx) * 100 : 0, count: reasonYes },
        { name: 'Stop/Review', value: totalAbx > 0 ? (stopYes / totalAbx) * 100 : 0, count: stopYes },
    ];

    // Diagnosis Breakdown
    const therapeuticCount = allAbxEntries.filter(a => (a as any).diagnosis === 'Therapeutic').length;
    const prophylacticCount = allAbxEntries.filter(a => (a as any).diagnosis === 'Prophylaxis').length;
    const diagnosisData = [
        { name: 'Therapeutic', value: therapeuticCount },
        { name: 'Prophylactic', value: prophylacticCount },
        { name: 'Other/Neonatal', value: totalAbx - therapeuticCount - prophylacticCount }
    ].filter(d => d.value > 0);

    return {
        totalAudits,
        totalAbx,
        complianceData,
        diagnosisData,
        topAuditors: getTopN(audits.map(a => a.auditor), 5),
        topDrugs: getTopN(allAbxEntries.map(a => (a as any).drug), 5),
        topWards: getTopN(audits.map(a => a.area), 5)
    };
  }, [auditData, selectedMonth, selectedYear]);


  // --- Data Processing for Prescription Tabs ---
  const processedData = useMemo(() => {
    const source = modeFilteredData;
    // Subsets
    const restrictedData = source.filter(d => d.drug_type === DrugType.RESTRICTED);
    const monitoredData = source.filter(d => d.drug_type === DrugType.MONITORED);
    
    // FIX: Filter by dispensed_by for Pharmacists (not requested_by)
    const pharmacyHandled = source.filter(d => d.dispensed_by && PHARMACISTS.includes(d.dispensed_by)); 
    
    // FIX: Filter by id_specialist for IDS (not dispensed_by), using legacy-aware matching
    const idsHandled = source.filter(d => d.id_specialist && (IDS_SPECIALISTS.includes(getCanonicalIdsName(d.id_specialist) || '') || isIdsNameMatch("Dr. Christoper John Tibayan", d.id_specialist)));
    
    // General
    const approvedItems = source.filter(i => i.status === PrescriptionStatus.APPROVED);
    const finalizedItems = source.filter(i => i.status === PrescriptionStatus.APPROVED || i.status === PrescriptionStatus.DISAPPROVED);
    const approvalRate = finalizedItems.length > 0 ? (approvedItems.length / finalizedItems.length * 100).toFixed(1) + '%' : 'N/A';
    
    // Pharmacy
    const pharmacistTimes = source
      .filter(i => i.dispensed_date && i.created_at)
      .map(i => new Date(i.dispensed_date!).getTime() - new Date(i.created_at!).getTime())
      .filter(time => !isNaN(time) && time >= 0) as number[]; 

    const avgPharmacistTime = pharmacistTimes.length > 0 ? formatDuration((pharmacistTimes as number[]).reduce((a, b) => a + b, 0) / (pharmacistTimes as number[]).length) : 'N/A';
    
    const pharmacistDecisions = [
        { name: 'Approved', value: pharmacyHandled.filter(p => p.status === PrescriptionStatus.APPROVED).length },
        { name: 'Disapproved', value: pharmacyHandled.filter(p => p.status === PrescriptionStatus.DISAPPROVED && !p.ids_disapproved_at).length }, 
        { name: 'Forwarded', value: pharmacyHandled.filter(p => p.status === PrescriptionStatus.FOR_IDS_APPROVAL || (p.drug_type === DrugType.RESTRICTED && (p.ids_approved_at || p.ids_disapproved_at))).length },
    ];
    
    // IDS
    const idsConsults = source.filter(i => (i.ids_approved_at || i.ids_disapproved_at) && i.dispensed_date);
    
    const idsTimes = idsConsults
      .map(i => {
        const approvedTime = i.ids_approved_at ? new Date(i.ids_approved_at).getTime() : NaN;
        const disapprovedTime = i.ids_disapproved_at ? new Date(i.ids_disapproved_at).getTime() : NaN;
        const dispensedTime = i.dispensed_date ? new Date(i.dispensed_date).getTime() : NaN;
        
        if (!isNaN(approvedTime) && !isNaN(dispensedTime)) return approvedTime - dispensedTime;
        if (!isNaN(disapprovedTime) && !isNaN(dispensedTime)) return disapprovedTime - dispensedTime;
        return NaN;
      })
      .filter(time => !isNaN(time) && time >= 0) as number[]; 

    const avgIdsTime = idsTimes.length > 0 ? formatDuration((idsTimes as number[]).reduce((a, b) => a + b, 0) / (idsTimes as number[]).length) : 'N/A';
    
    // Aggregating IDS stats using canonical name for Tibayan
    const idsOutcomesMap = new Map<string, { approved: number, disapproved: number }>();
    idsHandled.forEach(i => {
        const name = getCanonicalIdsName(i.id_specialist) || 'Unknown';
        const stats = idsOutcomesMap.get(name) || { approved: 0, disapproved: 0 };
        if (i.status === PrescriptionStatus.APPROVED) stats.approved++;
        if (i.status === PrescriptionStatus.DISAPPROVED) stats.disapproved++;
        idsOutcomesMap.set(name, stats);
    });

    const totalApprovedIds = Array.from(idsOutcomesMap.values()).reduce((sum, s) => sum + s.approved, 0);
    const totalDisapprovedIds = Array.from(idsOutcomesMap.values()).reduce((sum, s) => sum + s.disapproved, 0);

    const idsOutcomes = [
      { name: 'Approved', value: totalApprovedIds },
      { name: 'Disapproved', value: totalDisapprovedIds }
    ];
    
    const getFindingsDistribution = (items: Prescription[]) => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            if (item.findings && Array.isArray(item.findings)) {
                item.findings.forEach(f => {
                    counts[f.category] = (counts[f.category] || 0) + 1;
                });
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };
    
    const interventionStats = getFindingsDistribution(source);

    const avgTimePerIds = Object.entries((idsConsults as Prescription[]).reduce((acc: Record<string, number[]>, curr: Prescription) => {
        if (curr.id_specialist) { 
            const canonicalName = getCanonicalIdsName(curr.id_specialist) || 'Unknown';
            const approvedTime = curr.ids_approved_at ? new Date(curr.ids_approved_at).getTime() : NaN;
            const disapprovedTime = curr.ids_disapproved_at ? new Date(curr.ids_disapproved_at).getTime() : NaN;
            const dispensedTime = curr.dispensed_date ? new Date(curr.dispensed_date).getTime() : NaN;
            
            let timeDiff: number | null = null;
            if (!isNaN(approvedTime) && !isNaN(dispensedTime)) timeDiff = approvedTime - dispensedTime;
            else if (!isNaN(disapprovedTime) && !isNaN(dispensedTime)) timeDiff = disapprovedTime - dispensedTime;

            if (timeDiff !== null && !isNaN(timeDiff) && timeDiff >= 0) {
              if (!acc[canonicalName]) acc[canonicalName] = [];
              acc[canonicalName].push(timeDiff);
            }
        }
        return acc;
    }, {} as Record<string, number[]>)).map(([name, times]) => ({ name, value: (times.reduce((a,b)=>a+b,0)/times.length)/(1000*60*60) }));


    // Monthly Trend Calculation
    const monthlyTrend = Array.from({ length: 12 }, (_, monthIdx) => {
        const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthIdx];
        const count = data.filter(item => {
            const d = item.req_date ? new Date(item.req_date) : new Date(item.created_at || Date.now());
            return d.getFullYear() === selectedYear && d.getMonth() === monthIdx && item.status !== PrescriptionStatus.DELETED;
        }).length;
        return { name: monthName, value: count };
    });

    return {
      general: {
        totalRequests: source.length, approvalRate,
        adultCount: source.filter(p => p.mode === 'adult').length,
        pediaCount: source.filter(p => p.mode === 'pediatric').length,
        approvedTypeData: [{ name: DrugType.MONITORED, value: approvedItems.filter(i => i.drug_type === DrugType.MONITORED).length },{ name: DrugType.RESTRICTED, value: approvedItems.filter(i => i.drug_type === DrugType.RESTRICTED).length }],
        topAntimicrobials: getTopN(source.map(i => i.antimicrobial), 5),
        monthlyTrend
      },
      restricted: {
        total: restrictedData.length,
        approvalRate: (totalApprovedIds / (totalApprovedIds + totalDisapprovedIds) * 100 || 0).toFixed(1) + '%',
        avgIdsTime,
        topDrugs: getTopN(restrictedData.map(d => d.antimicrobial), 5),
        topIndications: getTopN(restrictedData.map(d => d.indication), 5),
        idsOutcomes,
      },
      monitored: {
        total: monitoredData.length,
        approvalRate: (monitoredData.filter(d => d.status === PrescriptionStatus.APPROVED).length / monitoredData.length * 100 || 0).toFixed(1) + '%',
        avgPharmacistTime,
        topDrugs: getTopN(monitoredData.map(d => d.antimicrobial), 5),
        topWards: getTopN(monitoredData.map(d => d.ward), 5),
      },
      pharmacy: {
        totalHandled: pharmacyHandled.length, avgPharmacistTime,
        topPharmacists: getTopN(pharmacyHandled.map(p => p.dispensed_by), 5), 
        decisions: pharmacistDecisions,
        interventionStats, 
      },
      ids: {
        totalConsults: idsHandled.length, avgIdsTime,
        approvalRate: (totalApprovedIds / (totalApprovedIds + totalDisapprovedIds) * 100 || 0).toFixed(1) + '%',
        topConsultants: getTopN(idsHandled.map(p => p.id_specialist), 5, true), 
        outcomes: idsOutcomes,
        avgTimePerConsultant: avgTimePerIds
      }
    };
  }, [modeFilteredData, data, selectedYear]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderDashboard = () => {
    switch(activeTab) {
      case 'AMS Monitoring':
        const mon = processedMonitoring;
        return <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="Active Patients" value={mon.activePatients} color="bg-blue-100 text-blue-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}/>
                <KpiCard title="Cumulative Missed" value={mon.totalMissed} subValue="Last doses logged" color="bg-red-100 text-red-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}/>
                <KpiCard title="Completed" value={mon.completedCount} color="bg-green-100 text-green-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}/>
                <KpiCard title="Avg. DOT" value={`${mon.avgDot} days`} color="bg-teal-100 text-teal-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title="Therapy Status Breakdown">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={mon.outcomes} dataKey="value" nameKey="name" outerRadius={100} label>
                                {mon.outcomes.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartWrapper>
                <ChartWrapper title="Reasons for Missed Doses">
                    <ResponsiveContainer>
                        <BarChart data={mon.missedReasons} layout="vertical" margin={{ left: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>
                <Top5List title="Top Monitored Antimicrobials" data={mon.topMonitoringDrugs} color="bg-indigo-100 text-indigo-700" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} />
            </div>
        </div>;

      case 'Audits':
        const a = processedAuditData;
        return <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Audits" value={a.totalAudits} subValue={`Covering ${a.totalAbx} drugs`} color="bg-amber-100 text-amber-700" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}/>
                <KpiCard title="Guidelines Compliant" value={(a.complianceData[0].value).toFixed(1) + '%'} subValue={`${a.complianceData[0].count}/${a.totalAbx} items`} color="bg-green-100 text-green-700" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}/>
                <KpiCard title="Indication Documented" value={(a.complianceData[1].value).toFixed(1) + '%'} subValue={`${a.complianceData[1].count}/${a.totalAbx} items`} color="bg-blue-100 text-blue-700" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title="Audit Compliance Rates">
                    <ResponsiveContainer>
                        <BarChart data={a.complianceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={30}>
                                {a.complianceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : (index === 1 ? '#3b82f6' : '#f59e0b')} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                <ChartWrapper title="Diagnosis Breakdown">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={a.diagnosisData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {a.diagnosisData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartWrapper>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Top5List title="Top Auditors" data={a.topAuditors} color="bg-amber-200 text-amber-900" icon={<></>} />
                <Top5List title="Top Audited Drugs" data={a.topDrugs} color="bg-blue-200 text-blue-900" icon={<></>} />
                <Top5List title="Top Wards Audited" data={a.topWards} color="bg-green-200 text-green-900" icon={<></>} />
            </div>
        </div>;

      case 'Restricted':
        const r = processedData.restricted;
        return <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Restricted Requests" value={r.total} color="bg-purple-100 text-purple-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.RESTRICTED), title: 'All Restricted Requests'})}/>
                <KpiCard title="IDS Approval Rate" value={r.approvalRate} color="bg-yellow-100 text-yellow-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => IDS_SPECIALISTS.includes(getCanonicalIdsName(d.id_specialist) || '')), title: 'All IDS Consults'})}/>
                <KpiCard title="Avg. IDS Review Time" value={r.avgIdsTime} color="bg-yellow-100 text-yellow-700" icon={<></>}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Top5List title="Top 5 Restricted Antimicrobials" data={r.topDrugs} color="bg-purple-200 text-purple-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.RESTRICTED), title: 'All Restricted Requests'})} />
                <Top5List title="Top 5 Indications for Restricted Drugs" data={r.topIndications} color="bg-purple-200 text-purple-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.RESTRICTED && d.indication), title: 'All Restricted Requests with Indication'})}/>
                <ChartWrapper title="IDS Review Outcomes">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={r.idsOutcomes} dataKey="value" nameKey="name" outerRadius={80} label>
                        <Cell fill="#16a34a"/><Cell fill="#ef4444"/>
                      </Pie>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartWrapper>
            </div>
        </div>
      case 'Monitored':
        const m = processedData.monitored;
        return <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Monitored Requests" value={m.total} color="bg-blue-100 text-blue-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.MONITORED), title: 'All Monitored Requests'})}/>
                <KpiCard title="Approval Rate (by Pharmacy)" value={m.approvalRate} color="bg-blue-100 text-blue-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.MONITORED), title: 'All Monitored Requests'})}/>
                <KpiCard title="Avg. Pharmacist Review Time" value={m.avgPharmacistTime} color="bg-blue-100 text-blue-700" icon={<></>}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Top5List title="Top 5 Monitored Antimicrobials" data={m.topDrugs} color="bg-blue-200 text-blue-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.MONITORED), title: 'All Monitored Requests'})}/>
                <Top5List title="Top 5 Wards for Monitored Drugs" data={m.topWards} color="bg-blue-200 text-blue-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.drug_type === DrugType.MONITORED && d.ward), title: 'All Monitored Requests with Ward'})}/>
            </div>
        </div>
      case 'Pharmacy':
        const p = processedData.pharmacy;
        return <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard title="Total Requests Handled" value={p.totalHandled} color="bg-green-100 text-green-700" icon={<></>} />
                <KpiCard title="Avg. First Action Time" value={p.avgPharmacistTime} color="bg-green-100 text-green-700" icon={<></>} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1">
                    <Top5List title="Top 5 Pharmacists by Activity" data={p.topPharmacists} color="bg-green-200 text-green-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.dispensed_by && PHARMACISTS.includes(d.dispensed_by)), title: 'All Pharmacy Activity'})} />
                </div>
                <div className="col-span-1">
                    <ChartWrapper title="Pharmacist Decisions">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={p.decisions} dataKey="value" nameKey="name" outerRadius={80} label>
                            <Cell fill="#16a34a"/><Cell fill="#ef4444"/><Cell fill="#3b82f6"/>
                          </Pie>
                          <Tooltip content={<CustomTooltip/>}/>
                          <Legend/>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartWrapper>
                </div>
                <div className="col-span-1">
                    <ChartWrapper title="Intervention Findings">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={p.interventionStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {p.interventionStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </div>
            </div>
        </div>
      case 'IDS':
        const i = processedData.ids;
        return <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total IDS Consults" value={i.totalConsults} color="bg-teal-100 text-teal-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.id_specialist && (IDS_SPECIALISTS.includes(getCanonicalIdsName(d.id_specialist) || '') || isIdsNameMatch("Dr. Christoper John Tibayan", d.id_specialist))), title: 'All IDS Consults'})}/>
                <KpiCard title="IDS Approval Rate" value={i.approvalRate} color="bg-teal-100 text-teal-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.id_specialist && (IDS_SPECIALISTS.includes(getCanonicalIdsName(d.id_specialist) || '') || isIdsNameMatch("Dr. Christoper John Tibayan", d.id_specialist))), title: 'All IDS Consults'})}/>
                <KpiCard title="Avg. IDS Turnaround Time" value={i.avgIdsTime} color="bg-teal-100 text-teal-700" icon={<></>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Top5List title="Top 5 IDS Consultants by Reviews" data={i.topConsultants} color="bg-teal-200 text-teal-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.id_specialist && (IDS_SPECIALISTS.includes(getCanonicalIdsName(d.id_specialist) || '') || isIdsNameMatch("Dr. Christoper John Tibayan", d.id_specialist))), title: 'All IDS Consults'})}/>
                <ChartWrapper title="IDS Decision Outcomes">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={i.outcomes} dataKey="value" nameKey="name" outerRadius={80} label>
                        <Cell fill="#16a34a"/><Cell fill="#ef4444"/>
                      </Pie>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartWrapper>
                <ChartWrapper title="Average time chart per IDS" onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.ids_approved_at || d.ids_disapproved_at), title: 'All IDS Consults'})}>
                  <ResponsiveContainer>
                    <BarChart data={i.avgTimePerConsultant} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                      <XAxis type="number" domain={[0, 'dataMax + 2']} />
                      <YAxis type="category" dataKey="name" tick={{fontSize: 12}} />
                      <Tooltip content={<CustomTooltip />} formatter={(value: string | number) => `${Number(value).toFixed(1)} hrs`}/>
                      <Bar dataKey="value" name="Avg. Hours" fill="#0d9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartWrapper>
            </div>
        </div>
      default: // General
        const g = processedData.general;
        return <div className="space-y-6">
            {/* Monthly Comparison Chart for "All Months" */}
            {selectedMonth === -1 && (
                <ChartWrapper title={`Monthly Request Trend (${selectedYear})`}>
                    <ResponsiveContainer>
                        <BarChart data={g.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar dataKey="value" name="Requests" fill="#009a3e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title="Total Requests" value={g.totalRequests} color="bg-gray-100 text-gray-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData, title: 'All Requests'})} />
              <KpiCard title="Overall Approval Rate" value={g.approvalRate} color="bg-gray-100 text-gray-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d=>d.status === 'approved' || d.status === 'disapproved'), title: 'All Finalized Requests'})} />
              <KpiCard title="Adult vs. Pedia Caseload" value={`${g.adultCount} / ${g.pediaCount}`} subValue="Adult / Pedia" color="bg-gray-100 text-gray-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData, title: 'All Requests'})} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartWrapper title="Approved: Monitored vs Restricted" onClick={() => setModalConfig({isOpen: true, data: modeFilteredData.filter(d => d.status === 'approved'), title: 'All Approved Requests'})}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={g.approvedTypeData} dataKey="value" nameKey="name" outerRadius={80} label>
                      <Cell fill="#3b82f6"/><Cell fill="#a855f7"/>
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </ChartWrapper>
              <Top5List title="Top 5 Antimicrobials (Overall)" data={g.topAntimicrobials} color="bg-gray-200 text-gray-800" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: modeFilteredData, title: 'All Requests'})} />
            </div>
        </div>
    }
  }

  const tabs = useMemo(() => {
    const baseTabs = ['General', 'Restricted', 'Monitored', 'Pharmacy', 'AMS Monitoring'];
    if (role === 'PHARMACIST') {
        return baseTabs.slice(0, 4); 
    }
    return [...baseTabs, 'IDS', 'Audits'];
  }, [role]);

  return (
    <div className="space-y-8">
      <ChartDetailModal isOpen={modalConfig.isOpen} onClose={handleModalClose} data={modalConfig.data} title={modalConfig.title} />
      
      {/* Unified Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm font-bold text-gray-600 mr-2">Patient Mode:</span>
            {(['All', 'adult', 'pediatric'] as const).map(mode => (
                <button key={mode} onClick={() => setModeFilter(mode)} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${modeFilter === mode ? 'bg-green-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
            ))}
        </div>
        <FilterControls 
            selectedMonth={selectedMonth}
            onMonthChange={onMonthChange}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
        />
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>
          ))}
        </nav>
      </div>

      {renderDashboard()}

    </div>
  );
};

export default StatsChart;
