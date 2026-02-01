
export interface Transaction {
  Source_Wallet_ID: string;
  Dest_Wallet_ID: string;
  Timestamp: string;
  Amount: number;
  Token_Type: string;
  txHash?: string;
}

export interface RiskPoint {
  timestamp: number;
  score: number;
}

export interface AgentFindings {
  topologyScore: number;
  temporalScore: number;
  propagationScore: number;
  evidence: string[];
  agentVotes: { [agentId: string]: boolean };
  finalSuspicionScore: number;
  temporalReasoning?: string;
  trajectory: RiskPoint[];
  lastUpdate: number;
  primaryTokenType?: string;
  ancestorId?: string;
}

export interface SuspicionLedger {
  [walletId: string]: AgentFindings;
}

export enum AgentStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  findingsCount: number;
}

export interface BehavioralSignature {
  id: string;
  patternName: string;
  description: string;
  confidence: number;
  indicators: string[];
}

export interface IntelligenceMemory {
  signatures: BehavioralSignature[];
  historicalClusters: string[][];
  knownSeedPatterns: string[];
}

export interface SurveillanceMetrics {
  totalTransactions: number;
  activeAlerts: number;
  avgRiskScore: number;
  networkVelocity: number; // Txs per min
}
