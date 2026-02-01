
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Play, Network, AlertTriangle, EyeOff, Eye, FileText, 
  Cpu, ChevronRight, Radio, Zap, LayoutDashboard, Database, 
  Activity, ArrowUpRight, Search, Filter, History, Info,
  Fingerprint, Map, ArrowRight, Download, Terminal, Layers, 
  Target, AlertCircle, CheckCircle2, TrendingUp, WifiOff, Boxes,
  Clock, ArrowRightCircle, ExternalLink, ArrowLeftCircle, Link2,
  Upload, FileJson, Beaker, FlaskConical, Trash2, FileSpreadsheet,
  Loader2, XCircle, PlayCircle, MousePointer2
} from 'lucide-react';
import { Transaction, SuspicionLedger, Agent, AgentStatus, SurveillanceMetrics } from './types';
import { analyzeTemporalPatterns, generateForensicReport } from './services/geminiService';
import { createLiveStream, createSimulatedStream } from './services/blockchainService';
import GraphView from './components/GraphView';
import AgentStatusList from './components/AgentStatusList';
import ForensicReport from './components/ForensicReport';

type Page = 'HOME' | 'DATA' | 'GRAPH' | 'DETECTOR';

const SEED_WALLETS = ['wallet_bad_001', 'wallet_bad_002', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'];
const SPY_SIGNATURES = ['0xbad', '1A1zP1', 'bc1q', 'mix', 'mule', 'mixer'];

const INITIAL_AGENTS: Agent[] = [
  { id: 'peeling-detect', name: 'Peeling Detective', role: 'Sequential Flow Analysis', status: AgentStatus.IDLE, findingsCount: 0 },
  { id: 'graph-miner', name: 'Graph Miner', role: 'Fan-Out Centrality ML', status: AgentStatus.IDLE, findingsCount: 0 },
  { id: 'temporal-breaker', name: 'Temporal Breaker', role: 'Behavioral Reasoning (AI)', status: AgentStatus.IDLE, findingsCount: 0 },
  { id: 'score-prop', name: 'Risk Diffusion', role: 'Contamination Engine', status: AgentStatus.IDLE, findingsCount: 0 },
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<SuspicionLedger>({});
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [isLive, setIsLive] = useState(false);
  const [report, setReport] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [regulatorMode, setRegulatorMode] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [metrics, setMetrics] = useState<SurveillanceMetrics>({
    totalTransactions: 0,
    activeAlerts: 0,
    avgRiskScore: 0,
    networkVelocity: 0
  });

  const ledgerRef = useRef<SuspicionLedger>({});
  const txRef = useRef<Transaction[]>([]);
  const walletOutboundCount = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (!isLive) return;
    const stopBtc = createLiveStream((tx) => handleNewTransaction(tx));
    const stopSim = createSimulatedStream((tx) => handleNewTransaction(tx));
    return () => { stopBtc(); stopSim(); };
  }, [isLive]);

  // AUTO-TRIGGER TEMPORAL BREAKER (Agent 3)
  useEffect(() => {
    const candidate = Object.entries(ledger)
      .filter(([, data]) => data.finalSuspicionScore > 0.2 && !data.temporalReasoning)
      .sort((a, b) => b[1].finalSuspicionScore - a[1].finalSuspicionScore)[0];

    if (candidate && !isRateLimited && agents[2].status !== AgentStatus.PROCESSING) {
      triggerTemporalAgent(candidate[0]);
    }
  }, [ledger, isRateLimited, agents]);

  const handleNewTransaction = async (tx: Transaction) => {
    const newTxs = [tx, ...txRef.current].slice(0, 1000);
    txRef.current = newTxs;
    setTransactions(newTxs);
    await executeAgentPipeline(tx);
  };

  const executeAgentPipeline = async (tx: Transaction) => {
    const wallets = [tx.Source_Wallet_ID, tx.Dest_Wallet_ID];
    const currentLedger = ledgerRef.current;
    
    walletOutboundCount.current[tx.Source_Wallet_ID] = (walletOutboundCount.current[tx.Source_Wallet_ID] || 0) + 1;

    for (const w of wallets) {
      if (!currentLedger[w]) {
        currentLedger[w] = { 
          topologyScore: 0.05, temporalScore: 0, propagationScore: 0, 
          evidence: [], agentVotes: {}, finalSuspicionScore: 0.05, 
          trajectory: [{ timestamp: Date.now(), score: 0.05 }], lastUpdate: Date.now(),
          primaryTokenType: tx.Token_Type
        };
      }
      const data = currentLedger[w];

      const isSeed = SEED_WALLETS.includes(w) || SPY_SIGNATURES.some(s => w.toLowerCase().includes(s));
      if (isSeed) {
        data.topologyScore = 1.0;
        if (!data.evidence.includes('[SIGNATURE] Matched Illicit Seed')) {
          data.evidence.push('[SIGNATURE] Matched Illicit Seed');
          incrementAgentFindings('graph-miner');
        }
      }

      const outCount = walletOutboundCount.current[tx.Source_Wallet_ID] || 0;
      if (outCount >= 3 && tx.Source_Wallet_ID === w) {
        data.topologyScore = Math.max(data.topologyScore, 0.85);
        if (!data.evidence.includes('[PEELING] Sequential Layering Detected')) {
          data.evidence.push('[PEELING] Sequential Layering Detected');
          incrementAgentFindings('peeling-detect');
        }
      }

      const src = currentLedger[tx.Source_Wallet_ID];
      if (src && src.finalSuspicionScore > 0.1 && tx.Dest_Wallet_ID === w) {
        const diffusion = src.finalSuspicionScore * 0.9; 
        if (diffusion > data.propagationScore) {
          data.propagationScore = diffusion;
          if (!data.evidence.includes('[CONTAMINATION] Indirect Exposure')) {
             data.evidence.push('[CONTAMINATION] Indirect Exposure');
             incrementAgentFindings('score-prop');
          }
        }
      }

      // SUSPECT SCORE CALCULATION
      data.finalSuspicionScore = Math.min(1.0, 
        (data.topologyScore * 0.3) + (data.temporalScore * 0.5) + (data.propagationScore * 0.2)
      );
    }

    ledgerRef.current = currentLedger;
    setLedger({ ...currentLedger });
    updateGlobalMetrics();
  };

  const triggerTemporalAgent = async (walletId: string) => {
    updateAgentStatus('temporal-breaker', AgentStatus.PROCESSING);
    const history = txRef.current.filter(t => t.Source_Wallet_ID === walletId || t.Dest_Wallet_ID === walletId);
    const result = await analyzeTemporalPatterns(walletId, history);
    
    if (result.reason === "QUOTA_EXCEEDED") {
      setIsRateLimited(true);
      updateAgentStatus('temporal-breaker', AgentStatus.ERROR);
      return;
    }

    setLedger(prev => {
      const updated = { ...prev };
      if (updated[walletId]) {
        updated[walletId].temporalScore = result.confidence || 0.8;
        updated[walletId].temporalReasoning = result.reason;
        const msg = `[CORRELATION] ${result.reason}`;
        if (!updated[walletId].evidence.includes(msg)) {
          updated[walletId].evidence.push(msg);
          incrementAgentFindings('temporal-breaker');
        }
      }
      ledgerRef.current = updated;
      return updated;
    });
    updateAgentStatus('temporal-breaker', AgentStatus.IDLE);
  };

  const resetForensics = () => {
    setTransactions([]);
    txRef.current = [];
    setLedger({});
    ledgerRef.current = {};
    walletOutboundCount.current = {};
    setAgents(INITIAL_AGENTS);
    updateGlobalMetrics();
  };

  const updateGlobalMetrics = () => {
    const vals = Object.values(ledgerRef.current);
    const alerts = vals.filter(v => v.finalSuspicionScore > 0.7);
    setMetrics({ 
      totalTransactions: txRef.current.length, 
      activeAlerts: alerts.length, 
      avgRiskScore: vals.length ? vals.reduce((a, b) => a + b.finalSuspicionScore, 0) / vals.length : 0, 
      networkVelocity: Math.floor(Math.random() * 20 + 20)
    });
  };

  const updateAgentStatus = (id: string, status: AgentStatus) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const incrementAgentFindings = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, findingsCount: a.findingsCount + 1 } : a));
  };

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto p-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">Diagnostic Core</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Autonomous Intelligence Status</p>
          </div>
          <button onClick={resetForensics} className="flex items-center gap-3 px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
            <Trash2 className="w-4 h-4" /> Reset Environment
          </button>
        </header>

        <div className="grid grid-cols-4 gap-8">
          {[
            { label: 'Avg Suspect Score', val: `${(metrics.avgRiskScore * 100).toFixed(1)}%`, icon: AlertTriangle, color: 'rose' },
            { label: 'Active Clusters', val: metrics.activeAlerts.toLocaleString(), icon: Database, color: 'indigo' },
            { label: 'Model Confidence', val: '0.998', icon: Zap, color: 'amber' },
            { label: 'Detection Velocity', val: `${metrics.networkVelocity} tx/m`, icon: Activity, color: 'emerald' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className={`p-3 w-fit rounded-2xl bg-${item.color}-50 text-${item.color}-600 mb-6`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
              <div className="text-3xl font-black text-slate-900 mono">{item.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-12">
          <div className="col-span-1">
            <AgentStatusList agents={agents} isStreaming={isLive} />
          </div>
          <div className="col-span-2 space-y-8">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 rounded-2xl"><Shield className="w-5 h-5 text-rose-600" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Forensic Targets</h3>
                </div>
                <button onClick={() => setCurrentPage('DETECTOR')} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2 hover:translate-x-1 transition-transform">Access Detector <ArrowUpRight className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {Object.entries(ledger).filter(([,d]) => d.finalSuspicionScore > 0.3).sort((a,b) => b[1].finalSuspicionScore - a[1].finalSuspicionScore).slice(0, 5).map(([id, d]) => (
                  <div key={id} className="flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black mono truncate max-w-[280px] text-slate-700">{id}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.evidence[0] || 'Awaiting Behavioral Motif...'}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-rose-600 uppercase">Suspect Score</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">{(d.finalSuspicionScore * 100).toFixed(0)}%</div>
                      </div>
                      <button onClick={() => { setSelectedWallet(id); setCurrentPage('DETECTOR'); }} className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 transition-all text-slate-400 hover:text-indigo-600 active:scale-90"><ArrowUpRight className="w-6 h-6" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="flex-1 overflow-y-auto p-12 bg-white flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">Diagnostic Flow</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Forensic Log</p>
          </div>
        </header>
        <div className="border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm bg-white flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Source_Node</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Destination_Node</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Quant (Token)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 text-[11px] font-bold text-slate-400 mono">{new Date(tx.Timestamp).toLocaleTimeString()}</td>
                  <td className="px-8 py-6 text-[12px] font-black text-slate-900 mono truncate max-w-[250px]">{tx.Source_Wallet_ID}</td>
                  <td className="px-8 py-6 text-[12px] font-black text-slate-900 mono truncate max-w-[250px]">{tx.Dest_Wallet_ID}</td>
                  <td className="px-8 py-6 text-[12px] font-black text-indigo-600 mono">{tx.Amount.toFixed(4)} ({tx.Token_Type})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGraph = () => (
    <div className="flex-1 flex overflow-hidden bg-[#F1F5F9] relative">
      <GraphView transactions={transactions} ledger={ledger} onSelectWallet={(id) => { setSelectedWallet(id); setCurrentPage('DETECTOR'); }} confidenceThreshold={0.4} regulatorMode={regulatorMode} />
    </div>
  );

  const renderDetector = () => (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC] text-slate-900">
      <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-5 mb-3">
               <div className="p-4 bg-rose-600 rounded-[2rem] shadow-xl"><Fingerprint className="w-8 h-8 text-white" /></div>
               <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Forensic Recon</h2>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Autonomous Proof of Intent Synthesis</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="p-12 bg-white border border-slate-100 rounded-[4rem] shadow-sm relative overflow-hidden min-h-[600px]">
               <div className="flex items-center justify-between mb-12 relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-4"><Map className="w-6 h-6 text-indigo-500" /> Intent Reconstruction</h3>
                  {selectedWallet && (
                    <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black mono flex items-center gap-4 shadow-lg">
                      <Target className="w-4 h-4 text-indigo-400" /> SUBJECT: {selectedWallet}
                    </div>
                  )}
               </div>

               {selectedWallet && ledger[selectedWallet] ? (
                 <div className="space-y-16 relative z-10">
                    <div className="flex items-center justify-center py-16 relative">
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                          <div className="w-[65%] h-px bg-slate-400 dashed-border"></div>
                       </div>
                       <div className="flex items-center gap-20 relative">
                          <div className="flex flex-col items-center gap-6">
                             <div className="w-24 h-24 rounded-full border-2 bg-rose-50 border-rose-500 shadow-xl flex items-center justify-center opacity-60"><AlertCircle className="w-10 h-10 text-rose-500" /></div>
                             <span className="text-[11px] font-black mono text-rose-600 uppercase tracking-widest">Ingress</span>
                          </div>
                          <ArrowRight className="w-12 h-12 text-slate-200" />
                          <div className="flex flex-col items-center gap-6">
                             <button onClick={() => setCurrentPage('GRAPH')} className="w-32 h-32 rounded-full border-2 bg-indigo-600 border-indigo-400 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"><Boxes className="w-12 h-12 text-white" /></button>
                             <span className="text-[11px] font-black mono text-indigo-600 uppercase tracking-widest">Hub</span>
                          </div>
                          <ArrowRight className="w-12 h-12 text-slate-200" />
                          <div className="flex flex-col items-center gap-6">
                             <div className="w-24 h-24 rounded-full border-2 bg-emerald-50 border-emerald-500 shadow-xl flex items-center justify-center opacity-60"><Target className="w-10 h-10 text-emerald-500" /></div>
                             <span className="text-[11px] font-black mono text-emerald-600 uppercase tracking-widest">Egress</span>
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                       <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100">
                          <div className="flex items-center justify-between mb-8">
                            <span className="text-[12px] font-black text-indigo-600 uppercase tracking-widest">Evidence Cache</span>
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="space-y-5">
                             {ledger[selectedWallet].evidence.map((ev, i) => (
                               <div key={i} className="flex gap-5 text-[12px] font-bold text-slate-600 bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm"><ChevronRight className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" /> {ev}</div>
                             ))}
                          </div>
                       </div>
                       <div className="p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 flex flex-col justify-center text-center italic relative">
                          <Terminal className="w-8 h-8 text-rose-600 mx-auto mb-6" />
                          <p className="text-[14px] font-black text-indigo-900 leading-relaxed italic">
                            "{ledger[selectedWallet].temporalReasoning || "Agentic synthesis is generating behavioral motifs..."}"
                          </p>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-64 bg-slate-50/20 border-2 border-dashed border-slate-100 rounded-[4rem] text-[13px] font-black text-slate-300 uppercase tracking-[0.4em]">Select an identified cluster to view reconstruction</div>
               )}
            </div>
          </div>
          <div className="space-y-8">
            <div className="p-10 bg-white border border-slate-100 rounded-[3.5rem] shadow-sm">
               <div className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] mb-12 px-2 flex justify-between">Forensic Queue <span className="bg-rose-100 px-4 py-1.5 rounded-full text-rose-600 font-bold">{metrics.activeAlerts}</span></div>
               <div className="space-y-5 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                 {Object.entries(ledger).filter(([,d]) => d.finalSuspicionScore > 0.1).sort((a,b) => b[1].finalSuspicionScore - a[1].finalSuspicionScore).map(([id, d]) => (
                   <button 
                    key={id} 
                    onClick={() => setSelectedWallet(id)}
                    className={`w-full p-8 rounded-[2.5rem] border transition-all text-left group active:scale-[0.98] ${selectedWallet === id ? 'bg-indigo-50 border-indigo-300 shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                   >
                     <div className="flex justify-between items-start mb-5">
                        <div className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${d.finalSuspicionScore > 0.7 ? 'bg-rose-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{d.finalSuspicionScore > 0.7 ? 'CRITICAL' : 'ELEVATED'}</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">{(d.finalSuspicionScore * 100).toFixed(0)}%</div>
                     </div>
                     <div className="text-[12px] font-black mono truncate text-slate-400 mb-4">{id}</div>
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">Inspect Cluster <ArrowRightCircle className="w-4 h-4" /></div>
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
      <nav className="flex items-center justify-between px-10 py-6 bg-white border-b border-slate-200/60 z-[100]">
        <div className="flex items-center gap-14">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-3xl transition-all duration-500 ${isLive ? 'bg-rose-600 shadow-xl' : 'bg-slate-900 shadow-xl'}`}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none uppercase">Master AI</h1>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Forensic Intelligence</div>
            </div>
          </div>
          <div className="flex gap-2">
            {(['HOME', 'DATA', 'GRAPH', 'DETECTOR'] as Page[]).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`px-8 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${currentPage === p ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className={`flex items-center gap-4 px-6 py-2.5 rounded-full text-[11px] font-black uppercase border transition-all ${isLive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
             <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse text-emerald-500' : ''}`} /> {isLive ? 'LIVE SURVEILLANCE' : 'SYSTEM STANDBY'}
           </div>
           <button onClick={() => setIsLive(!isLive)} className={`flex items-center gap-4 px-12 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${isLive ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-slate-900 text-white shadow-slate-300'}`}>
             {isLive ? <Zap className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />} {isLive ? 'TERMINATE' : 'INITIATE'}
           </button>
        </div>
      </nav>
      {currentPage === 'HOME' && renderHome()}
      {currentPage === 'DATA' && renderData()}
      {currentPage === 'GRAPH' && renderGraph()}
      {currentPage === 'DETECTOR' && renderDetector()}
      {report && <ForensicReport content={report} onClose={() => setReport('')} />}
    </div>
  );
};

export default App;
