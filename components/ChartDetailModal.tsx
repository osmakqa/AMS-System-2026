
import React from 'react';
import { Prescription } from '../types';

interface ChartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Prescription[];
  title: string;
}

const ChartDetailModal: React.FC<ChartDetailModalProps> = ({ isOpen, onClose, data, title }) => {
  if (!isOpen) return null;

  const exportToCsv = () => {
    if (data.length === 0) return;
    
    const headers = [
      'ID', 'Request Date', 'Patient Name', 'Hospital Number', 'Ward', 
      'Antimicrobial', 'Drug Type', 'Indication', 'Resident In-Charge', 
      'Dispensed By', 'Status'
    ];

    const keys: (keyof Prescription)[] = [
      'id', 'req_date', 'patient_name', 'hospital_number', 'ward', 
      'antimicrobial', 'drug_type', 'indication', 'resident_name', 
      'dispensed_by', 'status'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(row => {
        return keys.map(key => {
          let value = row[key] as any;
          if (value === null || value === undefined) {
            return '';
          }
          let stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            stringValue = `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${safeTitle}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">{title} ({data.length} records)</h3>
          <div className="flex gap-2">
            <button
              onClick={exportToCsv}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export to CSV
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Close</button>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Antimicrobial</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req. Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm"><div className="font-medium text-gray-900">{item.patient_name}</div><div className="text-gray-500">{item.hospital_number}</div></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.antimicrobial}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.ward}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(item.req_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChartDetailModal;
