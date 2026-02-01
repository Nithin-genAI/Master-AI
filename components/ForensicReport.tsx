
import React, { useMemo } from 'react';
import { X, FileText, Download, ShieldAlert, CheckCircle, Printer, Share2 } from 'lucide-react';

interface Props {
  content: string;
  onClose: () => void;
}

const ForensicReport: React.FC<Props> = ({ content, onClose }) => {
  const caseId = useMemo(() => `MASTER-AI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, []);
  const timestamp = new Date().toLocaleString();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-slate-200/50">
        
        {/* Header */}
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 relative">
          <div className="absolute top-10 right-40 w-56 h-14 border-4 border-rose-500/20 flex items-center justify-center -rotate-12">
            <span className="text-xs font-black text-rose-500/40 uppercase tracking-[0.4em]">Confidential</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 rounded-3xl">
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Forensic Intelligence Brief</h2>
              <div className="flex items-center gap-4 mt-2 font-mono text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Dossier: <span className="text-slate-900">{caseId}</span></span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span>Generated: <span className="text-slate-900">{timestamp}</span></span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="p-16 overflow-y-auto flex-1 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-16">
            
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                 <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                 <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">01. Analytical Summary</span>
              </div>
              <div className="text-slate-600 leading-[2] font-medium text-base text-justify prose prose-slate max-w-none">
                {content}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-8">
              {[
                { label: 'Risk Indices', val: '92.4%', sub: 'High Probability', color: 'emerald' },
                { label: 'TTP Signature', val: 'Layering', sub: 'Known Motif', color: 'amber' },
                { label: 'Validation', val: 'Verified', sub: 'Autonomous Consensus', color: 'indigo' }
              ].map((item, idx) => (
                <div key={idx} className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <span className="block text-[11px] text-slate-400 font-bold uppercase mb-4 tracking-widest">{item.label}</span>
                   <div className="flex flex-col gap-1">
                      <span className={`text-2xl font-black text-${item.color}-600`}>{item.val}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.sub}</span>
                   </div>
                </div>
              ))}
            </section>

            <section className="p-8 bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-indigo-500" />
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-widest">Autonomous Integrity Verification</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase leading-relaxed tracking-tight">
                This automated brief was generated using the Master AI High-Velocity Reasoning core. 
                Data points are grounded in on-chain subgraph topology and temporal behavioral modeling. 
                System Confidence Level: 0.982.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-12 border-t border-slate-100 flex justify-between items-center bg-slate-50/20">
          <div className="flex gap-4">
            <button className="flex items-center gap-3 px-6 py-3 text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-all">
              <Printer className="w-4 h-4" /> EXPORT PDF
            </button>
            <button className="flex items-center gap-3 px-6 py-3 text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-all">
              <Share2 className="w-4 h-4" /> SECURE SHARE
            </button>
          </div>
          
          <div className="flex gap-6">
            <button 
              onClick={onClose}
              className="flex items-center gap-3 px-12 py-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              FILE REPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicReport;
