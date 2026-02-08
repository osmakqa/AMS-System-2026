
import React from 'react';
import { LOGO_URL } from '../constants';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] p-0 md:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] flex flex-col overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#009a3e] text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
            <div className="flex items-center gap-3">
                <img src={LOGO_URL} alt="Logo" className="h-8 w-8 bg-white rounded-full p-0.5 shadow-sm" />
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold leading-tight">User Manual</h3>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">OsMak AMS System v1.9</p>
                </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto font-sans text-gray-900 leading-relaxed bg-gray-50/30">
            
            {/* Title Page */}
            <div className="text-center mb-12 border-b border-gray-200 pb-10">
                <img src={LOGO_URL} alt="Logo" className="h-24 w-24 mx-auto mb-6 drop-shadow-lg" />
                <h1 className="text-3xl md:text-4xl font-black text-green-900 mb-2 tracking-tight uppercase">Antimicrobial Stewardship System</h1>
                <h2 className="text-xl text-gray-600 font-medium italic">Ospital ng Makati</h2>
                <div className="mt-6 flex justify-center gap-2">
                    <span className="bg-green-100 text-green-800 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-green-200">Clinical Support</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-blue-200">Real-time Analytics</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-indigo-200">AI Verified</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* TOC / Quick Nav - Hidden on mobile */}
                <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-0">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Quick Navigation</h4>
                    <nav className="flex flex-col gap-2">
                        <a href="#overview" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">1. System Overview</a>
                        <a href="#getting-started" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">2. Getting Started</a>
                        <a href="#residents" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">3. For Residents</a>
                        <a href="#pharmacists" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">4. For Pharmacists</a>
                        <a href="#ids" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">5. For IDS Specialists</a>
                        <a href="#monitoring" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">6. AMS Monitoring</a>
                        <a href="#analytics" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">7. Data Analysis</a>
                        <a href="#troubleshooting" className="text-sm font-bold text-gray-600 hover:text-green-700 py-1 transition-colors">8. Troubleshooting</a>
                    </nav>
                </aside>

                {/* Main Text */}
                <div className="lg:col-span-9 space-y-12">
                    
                    {/* 1. System Overview */}
                    <section id="overview">
                        <h3 className="text-2xl font-black text-green-800 mb-4 flex items-center gap-3">
                            <span className="bg-green-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">1</span>
                            System Overview
                        </h3>
                        <p className="text-gray-700 text-base mb-4">
                            This platform manages the <strong>authorization lifecycle</strong> of antimicrobial prescriptions. It replaces manual paper forms with a structured digital workflow, enforcing IDS oversight for <strong>Restricted</strong> agents and Pharmacy surveillance for <strong>Monitored</strong> agents.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                            <h5 className="font-bold text-blue-900 text-sm mb-1 uppercase tracking-tight">AI Clinical Guardrails</h5>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                The system utilizes Google Gemini AI to provide real-time <strong>Renal Dosing Alerts</strong> (based on eGFR) and <strong>Pediatric Safety Checks</strong> (mg/kg/day verification). These alerts are clinical aids and do not replace professional judgement.
                            </p>
                        </div>
                    </section>

                    {/* 2. Getting Started */}
                    <section id="getting-started">
                        <h3 className="text-2xl font-black text-green-800 mb-4 flex items-center gap-3">
                            <span className="bg-green-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">2</span>
                            Getting Started
                        </h3>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                            <h4 className="font-black text-gray-900 mb-4 text-xs uppercase tracking-widest">Authentication Profiles</h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-100 text-left text-gray-400">
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Role</th>
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Password Format</th>
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Example</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-gray-800">
                                    <tr><td className="py-4 font-bold text-green-900">Resident</td><td className="font-mono text-gray-500">doctor123</td><td>doctor123</td></tr>
                                    <tr><td className="py-4 font-bold text-blue-900">Pharmacist</td><td className="font-mono text-gray-500">[lastname]123</td><td>abello123</td></tr>
                                    <tr><td className="py-4 font-bold text-purple-900">IDS Specialist</td><td className="font-mono text-gray-500">[lastname]456</td><td>tibayan456</td></tr>
                                    <tr><td className="py-4 font-bold text-red-900">AMS Admin</td><td className="font-mono text-gray-500">ams123</td><td>ams123</td></tr>
                                </tbody>
                            </table>
                            <p className="mt-4 text-[11px] text-gray-400 italic font-medium">Note: Passwords can be personalized in the account settings menu for Pharmacists and IDS.</p>
                        </div>
                    </section>

                    {/* 3. Residents */}
                    <section id="residents">
                        <h3 className="text-2xl font-black text-green-800 mb-4 flex items-center gap-3">
                            <span className="bg-green-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">3</span>
                            For Residents & Physicians
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <h4 className="font-black text-green-800 mb-3 text-[10px] uppercase tracking-widest">A. Public Submission</h4>
                                <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-4">
                                    <li>Click <strong>"Submit New Request"</strong> on login.</li>
                                    <li>Enter patient weight and SCr (Mandatory for eGFR).</li>
                                    <li>Select antimicrobial (Classification is automatic).</li>
                                    <li>Review AI Dosing alerts before final submission.</li>
                                </ol>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-orange-400">
                                <h4 className="font-black text-orange-700 mb-3 text-[10px] uppercase tracking-widest">B. Disapproval Handling</h4>
                                <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-4">
                                    <li>Log in via <strong>"Resident"</strong> tab.</li>
                                    <li>View the <strong>"Disapproved"</strong> queue.</li>
                                    <li>Click <strong>"Edit"</strong> to see clinical findings.</li>
                                    <li>Modify required fields and <strong>"Update & Resend"</strong>.</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* 4. Pharmacists */}
                    <section id="pharmacists">
                        <h3 className="text-2xl font-black text-green-800 mb-4 flex items-center gap-3">
                            <span className="bg-green-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">4</span>
                            For Pharmacists
                        </h3>
                        <div className="space-y-4">
                            <p className="text-gray-700">All incoming requests land in your <strong>"Pending"</strong> tab. Review clinical indications, lab values, and microbiology before acting.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-xl border-l-4 border-blue-500 shadow-sm">
                                    <h5 className="font-black text-[10px] text-blue-600 uppercase mb-1">Monitored Drugs</h5>
                                    <p className="text-xs font-bold text-gray-800">Cefotaxime, Ceftriaxone, etc.</p>
                                    <p className="text-xs text-gray-500 mt-1">Authorized for direct Approval or Disapproval.</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-l-4 border-red-500 shadow-sm">
                                    <h5 className="font-black text-[10px] text-red-600 uppercase mb-1">Restricted Drugs</h5>
                                    <p className="text-xs font-bold text-gray-800">Meropenem, Linezolid, etc.</p>
                                    <p className="text-xs text-gray-500 mt-1">Must be <strong>Forwarded to IDS</strong> or Disapproved.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-4">
                                <div className="text-indigo-600 shrink-0"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>
                                <div>
                                    <h5 className="font-black text-[10px] text-indigo-700 uppercase tracking-widest">Intervention Logging</h5>
                                    <p className="text-xs text-indigo-900 leading-relaxed">During review, click on any section (e.g. Clinical Data) to add <strong>Structured Findings</strong>. This data fuels the AMS intervention analytics.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. Monitoring */}
                    <section id="monitoring">
                        <h3 className="text-2xl font-black text-green-800 mb-4 flex items-center gap-3">
                            <span className="bg-green-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">5</span>
                            AMS Monitoring Dashboard
                        </h3>
                        <p className="text-gray-700 mb-4">A real-time flowsheet for tracking patient therapy progress, dose administration, and therapy outcomes.</p>
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-blue-600 px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest">Operational Flow</div>
                            <div className="p-5 space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-auto bg-blue-100 rounded-full shrink-0"></div>
                                    <p className="text-sm font-bold text-gray-800">Dose Logging: <span className="font-normal text-gray-600">Click a cell in the flowsheet to mark a dose as <strong>Given (G)</strong> or <strong>Missed (M)</strong>.</span></p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-auto bg-blue-100 rounded-full shrink-0"></div>
                                    <p className="text-sm font-bold text-gray-800">Days of Therapy (DOT): <span className="font-normal text-gray-600">The system automatically calculates therapy days relative to the start date.</span></p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-auto bg-blue-100 rounded-full shrink-0"></div>
                                    <p className="text-sm font-bold text-gray-800">Outcomes: <span className="font-normal text-gray-600">Use side panels to <strong>Stop</strong>, <strong>Complete</strong>, or <strong>Shift</strong> therapy.</span></p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 6. Analytics */}
                    <section id="analytics">
                        <h3 className="text-2xl font-black text-green-800 mb-4 flex items-center gap-3">
                            <span className="bg-green-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">6</span>
                            Data Analysis & AI Summaries
                        </h3>
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h4 className="font-black text-gray-900 mb-4 text-xs uppercase tracking-widest">Enhanced Metrics</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                    <div className="space-y-2">
                                        <p className="font-black text-green-700 uppercase text-[10px] tracking-tight">Total Approved KPI</p>
                                        <p className="text-gray-600 leading-relaxed">Direct count of authorized requests for rapid management reporting.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black text-blue-700 uppercase text-[10px] tracking-tight">Age Grouping</p>
                                        <p className="text-gray-600 leading-relaxed">Analysis categorized by clinical age brackets: Pediatric, Young Adult, Middle Age, and Elderly.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black text-indigo-700 uppercase text-[10px] tracking-tight">Granular Utilization</p>
                                        <p className="text-gray-600 leading-relaxed">Identification of the most frequently prescribed antimicrobial for <strong>every clinical department</strong> and <strong>ward</strong>.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black text-purple-700 uppercase text-[10px] tracking-tight">AI Intervention Clustering</p>
                                        <p className="text-gray-600 leading-relaxed">In the Pharmacy tab, use AI to automatically group free-text "Others" remarks into logical clinical categories.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 8. Troubleshooting */}
                    <section id="troubleshooting">
                        <h3 className="text-2xl font-black text-red-800 mb-4 flex items-center gap-3">
                            <span className="bg-red-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">!</span>
                            Troubleshooting
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-sm font-bold text-red-900">"Database Error" Message</p>
                                <p className="text-xs text-red-700 mt-1">Occurs when Firestore connectivity is lost. Verify your internet connection and refresh the browser. Contact IPC if persistent.</p>
                            </div>
                            <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                                <p className="text-sm font-bold text-gray-900">Missing Patient in Monitoring</p>
                                <p className="text-xs text-gray-700 mt-1">Patients must have an <strong>Approved</strong> antimicrobial request before they can be added to the Monitoring Dashboard.</p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>

        </div>
        
        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">OsMak AMS • Infection Prevention & Control</p>
            <button onClick={onClose} className="w-full md:w-auto px-10 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all active:scale-95">
                Close Manual
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;
