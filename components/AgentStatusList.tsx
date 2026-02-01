
import React from 'react';
import { Agent, AgentStatus } from '../types';
import { Cpu } from 'lucide-react';

interface Props {
  agents: Agent[];
  isStreaming: boolean;
}

const AgentStatusList: React.FC<Props> = ({ agents, isStreaming }) => {
  return (
    <div className="bg-white rounded-[2rem] p-10 border border-slate-50 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent Task Force</h3>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite] shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Streaming</span>
          </div>
        )}
      </div>

      <div className="space-y-2 relative flex-1">
        {/* Connection Spine */}
        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-100"></div>

        {agents.map((agent) => {
          const isActive = agent.status === AgentStatus.PROCESSING;
          
          return (
            <div key={agent.id} className="relative pl-24 py-8 group">
              {/* Outer Indicator Circle */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-slate-50 flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110' : ''}`}>
                 <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center relative">
                    {/* Focal Dot - Blinks Emerald Green when active */}
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      isActive ? 'bg-emerald-500 animate-pulse' : 
                      agent.findingsCount > 0 ? 'bg-slate-400' : 'bg-slate-200'
                    }`}></div>
                    
                    {/* Active Pulse Ring */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-[ping_2s_infinite] opacity-30"></div>
                    )}
                 </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-base font-black uppercase tracking-tighter ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {agent.name}
                  </h4>
                  {agent.findingsCount > 0 && (
                    <div className="px-5 py-1.5 bg-rose-50 rounded-full">
                       <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">
                         {agent.findingsCount} Alerts
                       </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {agent.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentStatusList;
