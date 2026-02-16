import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Prescription, PrescriptionStatus, DrugType, AMSAudit, MonitoringPatient, AdminLogEntry } from '../types';
import ChartDetailModal from './ChartDetailModal';
import { IDS_SPECIALISTS, PHARMACISTS } from '../constants';
import { summarizeOtherInterventions } from '../services/geminiService';

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

const getCanonicalIdsName = (name: string | undefined | null) => {
    if (!name) return name;
    const clean = name.toLowerCase().trim();
    const tibayanVariants = ["dr. christopher john tibayan", "dr. christoper john tibayan"];
    if (tibayanVariants.includes(clean)) return "Dr. Christoper John Tibayan";
    return name;
};

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

const getCensus = (items: (string | undefined)[], useCanonicalIds: boolean = false) => {
  const counts = new Map<string, number>();
  items.forEach(item => { 
      if (item) { 
          const nameToUse = useCanonicalIds ? getCanonicalIdsName(item) : item;
          if (nameToUse) counts.set(nameToUse, (counts.get(nameToUse) || 0) + 1); 
      } 
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
};

const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-black">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const ChartWrapper = ({ title, children, onClick, icon, heightClass = "h-[400px]" }: { title: string, children?: React.ReactNode, onClick?: () => void, icon?: React.ReactNode, heightClass?: string }) => (
  <div 
    className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 ${heightClass} flex flex-col transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:border-green-300 hover:-translate-y-1' : ''}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-md font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
      {icon}
    </div>
    <div className="flex-grow w-full h-full">{children}</div>
  </div>
);

const KpiCard = ({ title, value, subValue, icon, color, onClick }: { title: string, value: string | number, subValue?: string, icon: React.ReactNode, color: string, onClick?: () => void }) => (
  <div className={`bg-white p-5 rounded-xl shadow-lg border border-gray-200 flex items-center gap-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:border-green-300 hover:-translate-y-1' : ''}`} onClick={onClick}>
    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${color}`}>{icon}</div>
    <div className="overflow-hidden">
      <p className="text-2xl font-bold text-gray-800 truncate">{value}</p>
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  </div>
);

const Top5List = ({ title, data, color, icon, onClick }: { title: string, data: { name: string, value: number }[], color: string, icon: React.ReactNode, onClick?: () => void }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:border-green-300 hover:-translate-y-1' : ''}`} onClick={onClick}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
        </div>
        <div className="space-y-3">
            {data.length > 0 ? data.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                    <span className="text-xs font-medium text-gray-700 truncate">{index + 1}. {item.name}</span>
                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${color}`}>{item.value}</span>
                </div>
            )) : <div className="text-center py-4 text-gray-400 text-xs italic">No data</div>}
        </div>
    </div>
);

const StatsChart: React.FC<StatsChartProps> = ({ data, allData, auditData = [], monitoringData = [], role, selectedMonth, onMonthChange, selectedYear, onYearChange }) => {
  const [activeTab, setActiveTab] = useState('General');
  const [modeFilter, setModeFilter] = useState<'All' | 'adult' | 'pediatric'>('All');
  const [generalDrugFilter, setGeneralDrugFilter] = useState<'All' | 'Monitored' | 'Restricted'>('All');
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; data: Prescription[]; title: string }>({ isOpen: false, data: [], title: '' });
  const [aiOthersData, setAiOthersData] = useState<{ name: string, value: number }[]>([]);
  const [isAnalyzingOthers, setIsAnalyzingOthers] = useState(false);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];

  const modeFilteredData = useMemo(() => {
    let filtered = data.filter(item => {
      const d = item.req_date ? new Date(item.req_date) : new Date(item.created_at || Date.now());
      const mMatch = selectedMonth === -1 || d.getMonth() === selectedMonth;
      const yMatch = selectedYear === 0 || d.getFullYear() === selectedYear;
      return mMatch && yMatch && item.status !== PrescriptionStatus.DELETED;
    });
    if (modeFilter !== 'All') filtered = filtered.filter(d => d.mode === modeFilter);
    return filtered;
  }, [data, modeFilter, selectedMonth, selectedYear]);

  const processedData = useMemo(() => {
    const source = modeFilteredData;
    const generalSource = generalDrugFilter === 'All' ? source : source.filter(d => d.drug_type === generalDrugFilter);
    const approved = generalSource.filter(i => i.status === PrescriptionStatus.APPROVED);
    const disapproved = generalSource.filter(i => i.status === PrescriptionStatus.DISAPPROVED);
    const throughput = approved.length + disapproved.length;
    const approvalRate = throughput > 0 ? (approved.length / throughput * 100).toFixed(1) + '%' : '0%';
    
    const getFindingsDistribution = (items: Prescription[]) => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            item.findings?.forEach(f => {
                counts[f.category] = (counts[f.category] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    };

    const getOthersBreakdown = (items: Prescription[]) => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            item.findings?.filter(f => f.category === 'Others').forEach(f => {
                const detail = f.details.trim() || 'No Details Provided';
                counts[detail] = (counts[detail] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 15);
    };

    const idsConsults = source.filter(i => i.ids_approved_at || i.ids_disapproved_at);
    const idsApprovedCount = idsConsults.filter(i => i.status === PrescriptionStatus.APPROVED).length;
    const idsApprovalRate = idsConsults.length > 0 ? (idsApprovedCount / idsConsults.length * 100).toFixed(1) + '%' : '0%';

    const idsTurnaroundHours = idsConsults
      .filter(i => i.dispensed_date && (i.ids_approved_at || i.ids_disapproved_at))
      .map(i => {
          const start = new Date(i.dispensed_date!).getTime();
          const end = new Date(i.ids_approved_at || i.ids_disapproved_at!).getTime();
          return Math.max(0, (end - start) / (1000 * 60 * 60));
      });
    const avgIdsHours = idsTurnaroundHours.length > 0 ? (idsTurnaroundHours.reduce((a,b)=>a+b,0)/idsTurnaroundHours.length).toFixed(1) : '0';

    return {
      general: {
        totalRequests: generalSource.length,
        totalDisapproved: disapproved.length,
        totalApproved: approved.length,
        approvalRate,
        topAntimicrobials: getTopN(approved.map(i => i.antimicrobial), 5),
        topDepartments: getTopN(approved.map(i => i.clinical_dept), 5),
        topWards: getTopN(approved.map(i => i.ward), 5),
        deptCensus: getCensus(generalSource.map(i => i.clinical_dept)),
        wardCensus: getCensus(generalSource.map(i => i.ward)),
        indicationData: getTopN(approved.map(i => i.indication), 5),
        systemSiteData: getTopN(approved.map(i => i.system_site === 'OTHERS (SPECIFY)' ? i.system_site_other : i.system_site), 15),
        antimicrobialCensus: getCensus(generalSource.map(i => i.antimicrobial)),
        interventions: getFindingsDistribution(generalSource),
      },
      disapproved: {
        total: source.filter(i => i.status === PrescriptionStatus.DISAPPROVED).length,
        topDepts: getTopN(source.filter(i => i.status === PrescriptionStatus.DISAPPROVED).map(i => i.clinical_dept), 5),
        topWards: getTopN(source.filter(i => i.status === PrescriptionStatus.DISAPPROVED).map(i => i.ward), 5),
        topDrugs: getTopN(source.filter(i => i.status === PrescriptionStatus.DISAPPROVED).map(i => i.antimicrobial), 5),
        interventions: getFindingsDistribution(source.filter(i => i.status === PrescriptionStatus.DISAPPROVED)),
      },
      pharmacy: {
        totalActions: source.filter(i => i.dispensed_date).length,
        approvedCount: source.filter(i => i.status === PrescriptionStatus.APPROVED && i.dispensed_by).length,
        disapprovedCount: source.filter(i => i.status === PrescriptionStatus.DISAPPROVED && i.dispensed_by).length,
        interventions: getFindingsDistribution(source).slice(0, 10),
        topPharmacists: getTopN(source.map(i => i.dispensed_by), 10),
        otherDetailsList: source.flatMap(i => i.findings?.filter(f => f.category === 'Others').map(f => f.details) || []),
        othersBreakdown: getOthersBreakdown(source),
      },
      ids: {
        consults: idsConsults.length,
        approvalRate: idsApprovalRate,
        avgHours: avgIdsHours,
        pendingPerIds: getTopN(source.filter(i => i.status === PrescriptionStatus.FOR_IDS_APPROVAL).map(i => i.id_specialist), 10, true),
        turnaroundPerIds: Object.entries(idsConsults.reduce((acc: any, curr) => {
            const name = getCanonicalIdsName(curr.id_specialist) || 'Unknown';
            const start = new Date(curr.dispensed_date!).getTime();
            const end = new Date(curr.ids_approved_at || curr.ids_disapproved_at!).getTime();
            if(!isNaN(start) && !isNaN(end)) {
                if(!acc[name]) acc[name] = [];
                acc[name].push((end - start) / (1000 * 60 * 60));
            }
            return acc;
        }, {})).map(([name, values]: any) => ({ name, value: parseFloat((values.reduce((a:any,b:any)=>a+b,0)/values.length).toFixed(1)) })),
        outcomesPerIds: Object.entries(idsConsults.reduce((acc: any, curr) => {
            const name = getCanonicalIdsName(curr.id_specialist) || 'Unknown';
            if(!acc[name]) acc[name] = { Approved: 0, Disapproved: 0 };
            if(curr.status === PrescriptionStatus.APPROVED) acc[name].Approved++;
            else if(curr.status === PrescriptionStatus.DISAPPROVED) acc[name].Disapproved++;
            return acc;
        }, {})).map(([name, val]: any) => ({ name, ...val }))
      }
    };
  }, [modeFilteredData, generalDrugFilter]);

  const handleClusterOthers = async () => {
    if (processedData.pharmacy.otherDetailsList.length === 0) return;
    setIsAnalyzingOthers(true);
    try {
      const result = await summarizeOtherInterventions(processedData.pharmacy.otherDetailsList);
      setAiOthersData(result);
    } catch (err) { console.error(err); } finally { setIsAnalyzingOthers(false); }
  };

  const handleDrillDown = (field: keyof Prescription | 'ids_specialist_match' | 'system_site_match' | 'finding_category', value: string, sourceData?: Prescription[]) => {
    const drillSource = sourceData || modeFilteredData;
    let filtered: Prescription[] = [];

    if (field === 'ids_specialist_match') {
        filtered = drillSource.filter(i => getCanonicalIdsName(i.id_specialist) === value);
    } else if (field === 'system_site_match') {
        filtered = drillSource.filter(i => (i.system_site === 'OTHERS (SPECIFY)' ? i.system_site_other : i.system_site) === value);
    } else if (field === 'finding_category') {
        filtered = drillSource.filter(i => i.findings?.some(f => f.category === value));
    } else {
        filtered = drillSource.filter(i => String(i[field]) === value);
    }

    setModalConfig({
        isOpen: true,
        data: filtered,
        title: `Drilldown: ${value}`
    });
  };

  const renderDashboard = () => {
    switch(activeTab) {
      case 'General':
        const g = processedData.general;
        const generalSource = generalDrugFilter === 'All' ? modeFilteredData : modeFilteredData.filter(d => d.drug_type === generalDrugFilter);
        const approvedData = generalSource.filter(i => i.status === PrescriptionStatus.APPROVED);
        return (
          <div className="space-y-6 animate-fade-in">
            {/* General Filter Switcher */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">General View Filter</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['All', 'Monitored', 'Restricted'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setGeneralDrugFilter(f)} 
                            className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md transition-all ${generalDrugFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title={`Total ${generalDrugFilter === 'All' ? '' : generalDrugFilter} Requests`} value={g.totalRequests} subValue="All status" color="bg-gray-100 text-gray-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} onClick={() => handleDrillDown('status', 'general_requests', generalSource)}/>
                <KpiCard title="Total Approved" value={g.totalApproved} color="bg-green-100 text-green-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} onClick={() => handleDrillDown('status', 'approved', generalSource)}/>
                <KpiCard title="Total Disapproved" value={g.totalDisapproved} color="bg-red-100 text-red-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} onClick={() => handleDrillDown('status', 'disapproved', generalSource)}/>
                <KpiCard title="Approval Rate" value={g.approvalRate} color="bg-blue-100 text-blue-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title="Department Breakdown (Census)">
                    <ResponsiveContainer>
                        <BarChart data={g.deptCensus} layout="vertical" margin={{ left: 120 }} onClick={(e) => e && e.activeLabel && handleDrillDown('clinical_dept', e.activeLabel, generalSource)}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} cursor="pointer" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} cursor="pointer"/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>
                <ChartWrapper title="Ward Breakdown (Census)">
                    <ResponsiveContainer>
                        <BarChart data={g.wardCensus} layout="vertical" margin={{ left: 120 }} onClick={(e) => e && e.activeLabel && handleDrillDown('ward', e.activeLabel, generalSource)}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} cursor="pointer" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} cursor="pointer"/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>
            </div>

            <ChartWrapper title={`${generalDrugFilter} Antimicrobial Census (All Statuses)`}>
                <ResponsiveContainer>
                    <BarChart data={g.antimicrobialCensus} layout="vertical" margin={{ left: 120 }} onClick={(e) => e && e.activeLabel && handleDrillDown('antimicrobial', e.activeLabel, generalSource)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} cursor="pointer" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} cursor="pointer" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title="Top 5 Antimicrobials (Approved)">
                    <ResponsiveContainer>
                        <BarChart data={g.topAntimicrobials} layout="vertical" margin={{ left: 100 }} onClick={(e) => e && e.activeLabel && handleDrillDown('antimicrobial', e.activeLabel, approvedData)}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} cursor="pointer"/>
                            <Tooltip />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} cursor="pointer"/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>
                <ChartWrapper title="Indications Breakdown (Approved)">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie 
                                data={g.indicationData} 
                                dataKey="value" 
                                nameKey="name" 
                                outerRadius={120} 
                                label={renderCustomizedPieLabel} 
                                labelLine={false}
                                onClick={(e) => handleDrillDown('indication', e.name, approvedData)}
                            >
                                {g.indicationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer"/>)}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartWrapper>
            </div>
            
            <ChartWrapper title="Detailed System / Site Breakdown (Approved)" heightClass="h-[600px]">
                <ResponsiveContainer>
                    <BarChart data={g.systemSiteData} layout="vertical" margin={{ left: 150 }} onClick={(e) => e && e.activeLabel && handleDrillDown('system_site_match', e.activeLabel, approvedData)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} cursor="pointer" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} cursor="pointer"/>
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper title="Intervention Findings (All Categories)">
                <ResponsiveContainer>
                    <BarChart data={g.interventions} layout="vertical" margin={{ left: 120 }} onClick={(e) => e && e.activeLabel && handleDrillDown('finding_category', e.activeLabel, generalSource)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={110} cursor="pointer" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} cursor="pointer" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Top5List title="Top 5 Departments (Approved)" data={g.topDepartments} color="bg-emerald-600" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: approvedData, title: 'Approved Requests by Department'})}/>
                 <Top5List title="Top 5 Wards (Approved)" data={g.topWards} color="bg-blue-600" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: approvedData, title: 'Approved Requests by Ward'})}/>
            </div>
          </div>
        );

      case 'Disapproved':
        const d = processedData.disapproved;
        const disapprovedData = modeFilteredData.filter(i => i.status === PrescriptionStatus.DISAPPROVED);
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="Total Disapproved" value={d.total} color="bg-red-100 text-red-700" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} onClick={() => handleDrillDown('status', 'disapproved')}/>
                <Top5List title="Top 5 Departments" data={d.topDepts} color="bg-red-600" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: disapprovedData, title: 'Disapproved by Dept'})}/>
                <Top5List title="Top 5 Wards" data={d.topWards} color="bg-red-500" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: disapprovedData, title: 'Disapproved by Ward'})}/>
                <Top5List title="Top 5 Antimicrobials" data={d.topDrugs} color="bg-red-400" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: disapprovedData, title: 'Disapproved by Drug'})}/>
            </div>
            <ChartWrapper title="Reason for Disapproval Breakdown">
                <ResponsiveContainer>
                    <BarChart data={d.interventions} layout="vertical" margin={{ left: 150 }} onClick={(e) => e && e.activeLabel && handleDrillDown('finding_category', e.activeLabel, disapprovedData)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} cursor="pointer" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} cursor="pointer" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>
          </div>
        );

      case 'Pharmacy':
        const p = processedData.pharmacy;
        const pharmacistActions = modeFilteredData.filter(i => i.dispensed_date && i.dispensed_by);
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Pharmacist Actions" value={p.totalActions} color="bg-blue-100 text-blue-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: pharmacistActions, title: 'Pharmacist Actions'})}/>
                <KpiCard title="Approved by Pharmacist" value={p.approvedCount} color="bg-green-100 text-green-700" icon={<></>} onClick={() => handleDrillDown('status', 'approved', pharmacistActions)}/>
                <KpiCard title="Disapproved by Pharmacist" value={p.disapprovedCount} color="bg-red-100 text-red-700" icon={<></>} onClick={() => handleDrillDown('status', 'disapproved', pharmacistActions)}/>
            </div>
            <ChartWrapper title="Pharmacist Activity (Total Actions)">
                <ResponsiveContainer>
                    <BarChart data={p.topPharmacists} layout="vertical" margin={{ left: 120 }} onClick={(e) => e && e.activeLabel && handleDrillDown('dispensed_by', e.activeLabel)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} cursor="pointer" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} cursor="pointer" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>
            
            <ChartWrapper 
                title="Top Intervention Findings"
                heightClass="h-[500px]"
                icon={
                    <button onClick={handleClusterOthers} disabled={isAnalyzingOthers || p.otherDetailsList.length === 0} className="text-[10px] font-black uppercase bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 disabled:bg-gray-300">
                        {isAnalyzingOthers ? 'Analyzing...' : 'AI Summary (Others)'}
                    </button>
                }
            >
                <ResponsiveContainer>
                    <BarChart data={aiOthersData.length > 0 ? aiOthersData : p.interventions} layout="vertical" margin={{ left: 150 }} onClick={(e) => e && e.activeLabel && handleDrillDown('finding_category', e.activeLabel)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} width={140} cursor="pointer" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} cursor="pointer" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper title="Breakdown of 'Others' Intervention Details" heightClass="h-[600px]">
                <ResponsiveContainer>
                    <BarChart data={p.othersBreakdown} layout="vertical" margin={{ left: 180 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={170} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>
          </div>
        );

      case 'IDS':
        const ids = processedData.ids;
        const idsConsults = modeFilteredData.filter(i => i.ids_approved_at || i.ids_disapproved_at);
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard title="IDS Approval Rate" value={ids.approvalRate} subValue="Excludes pharma disapprovals" color="bg-teal-100 text-teal-700" icon={<></>} />
                    <KpiCard title="Avg. IDS Turnaround" value={`${ids.avgHours} hrs`} subValue="From Forward to Action" color="bg-teal-100 text-teal-700" icon={<></>} />
                    <KpiCard title="Total Finalized Consults" value={ids.consults} color="bg-teal-100 text-teal-700" icon={<></>} onClick={() => setModalConfig({isOpen: true, data: idsConsults, title: 'IDS Consultations'})} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartWrapper title="Pending Requests per IDS">
                        <ResponsiveContainer>
                            <BarChart data={ids.pendingPerIds} layout="vertical" margin={{ left: 120 }} onClick={(e) => e && e.activeLabel && handleDrillDown('ids_specialist_match', e.activeLabel, modeFilteredData.filter(i => i.status === PrescriptionStatus.FOR_IDS_APPROVAL))}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} cursor="pointer" />
                                <Tooltip />
                                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} cursor="pointer" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                    <ChartWrapper title="Average Turnaround Time per IDS (Hours)">
                        <ResponsiveContainer>
                            <BarChart data={ids.turnaroundPerIds} layout="vertical" margin={{ left: 120 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </div>
                <ChartWrapper title="IDS Decision Outcomes per Specialist">
                    <ResponsiveContainer>
                        <BarChart data={ids.outcomesPerIds} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={(e) => e && e.activeLabel && handleDrillDown('ids_specialist_match', e.activeLabel, idsConsults)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 10}} cursor="pointer" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Approved" stackId="a" fill="#10b981" cursor="pointer" />
                            <Bar dataKey="Disapproved" stackId="a" fill="#ef4444" cursor="pointer" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>
            </div>
        );

      default: return null;
    }
  };

  const availableTabs = useMemo(() => {
    const base = ['General', 'Disapproved', 'Pharmacy', 'IDS'];
    if (role === 'AMS_ADMIN') return [...base, 'Audits', 'AMS Monitoring'];
    return base;
  }, [role]);

  return (
    <div className="space-y-8">
      <ChartDetailModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} data={modalConfig.data} title={modalConfig.title} />
      
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Patient Mode</span>
            {(['All', 'adult', 'pediatric'] as const).map(m => (
                <button key={m} onClick={() => setModeFilter(m)} className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${modeFilter === m ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {m}
                </button>
            ))}
        </div>
        <div className="flex gap-4">
            <select value={selectedMonth} onChange={e => onMonthChange(parseInt(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold [color-scheme:light] outline-none focus:ring-2 focus:ring-blue-500">
                <option value={-1}>All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => onYearChange(parseInt(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold [color-scheme:light] outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>All Years</option>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto no-scrollbar">
        <nav className="-mb-px flex space-x-8 min-w-max">
          {availableTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{tab}</button>
          ))}
        </nav>
      </div>

      {renderDashboard()}
    </div>
  );
};

export default StatsChart;