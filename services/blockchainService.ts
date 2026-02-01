
import { Transaction } from "../types";

export const createLiveStream = (onTransaction: (tx: Transaction) => void) => {
  let ws: WebSocket | null = null;
  const connect = () => {
    try {
      ws = new WebSocket('wss://ws.blockchain.info/inv');
      ws.onopen = () => {
        console.log('[SURVEILLANCE] Ingestion Socket Connected');
        ws?.send(JSON.stringify({ "op": "unconfirmed_sub" }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.op === 'utx') {
          const txData = data.x;
          const totalAmount = txData.out.reduce((sum: number, output: any) => sum + (output.value / 100000000), 0);
          const normalizedTx: Transaction = {
            Source_Wallet_ID: txData.inputs[0]?.prev_out?.addr || 'INPUT_UNKNOWN',
            Dest_Wallet_ID: txData.out[0]?.addr || 'DEST_UNKNOWN',
            Amount: parseFloat(totalAmount.toFixed(8)),
            Token_Type: 'Bitcoin',
            Timestamp: new Date().toISOString(),
            txHash: txData.hash
          };
          onTransaction(normalizedTx);
        }
      };
      ws.onclose = () => {
        console.log('[SURVEILLANCE] Ingestion Socket Closed. Retrying...');
        setTimeout(connect, 5000);
      };
    } catch (e) {
      console.error('[SURVEILLANCE] Connection Failed:', e);
    }
  };
  connect();
  return () => ws?.close();
};

export const createSimulatedStream = (onTransaction: (tx: Transaction) => void) => {
  const MOCK_MULES = ['mule_alpha_7', 'mule_beta_2', 'mule_gamma_9', 'node_obf_102', 'mixer_input_01'];
  const MOCK_SEEDS = ['wallet_bad_001', 'wallet_bad_002', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'];
  
  // State for complex patterns
  let peelingSource: string | null = null;
  let peelingCount = 0;

  const interval = setInterval(() => {
    let source: string;
    let dest: string;
    let amount: number;
    let type: string = Math.random() > 0.5 ? 'Bitcoin' : 'Ethereum';

    // PATTERN 1: PEELING CHAIN (Sequential high-risk activity)
    if (peelingSource && peelingCount < 5) {
      source = peelingSource;
      dest = `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16)}`;
      amount = 0.05 + (Math.random() * 0.1); // Small "peels"
      peelingCount++;
      if (peelingCount >= 5) peelingSource = null;
    } 
    // PATTERN 2: INITIATE PEELING CHAIN
    else if (Math.random() > 0.85) {
      source = MOCK_SEEDS[Math.floor(Math.random() * MOCK_SEEDS.length)];
      dest = MOCK_MULES[Math.floor(Math.random() * MOCK_MULES.length)];
      amount = 10.0 + (Math.random() * 5); // Large initial move
      peelingSource = dest;
      peelingCount = 0;
    }
    // PATTERN 3: RANDOM BACKGROUND NOISE
    else {
      source = `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16)}`;
      dest = `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16)}`;
      amount = Math.random() * 2;
    }

    onTransaction({
      Source_Wallet_ID: source,
      Dest_Wallet_ID: dest,
      Amount: parseFloat(amount.toFixed(4)),
      Token_Type: type,
      Timestamp: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).slice(2, 14)}...`
    });
  }, 2500);

  return () => clearInterval(interval);
};
