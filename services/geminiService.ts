
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

export const analyzeTemporalPatterns = async (walletId: string, history: Transaction[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const historySnippet = history.map(tx => 
    `Source: ${tx.Source_Wallet_ID}, Dest: ${tx.Dest_Wallet_ID}, Time: ${tx.Timestamp}, Amt: ${tx.Amount}`
  ).join('\n');

  const prompt = `
    ACT AS MASTER AI TEMPORAL BREAKER.
    Perform a Forensic Correlation Analysis on wallet "${walletId}".
    
    CRITICAL EVALUATION PARAMETERS:
    1. Temporal Entropy: Identify sub-second or perfectly intervaled transaction bursts.
    2. Micro-burst Aggregation: Detect "Dust" collection before major fan-out.
    3. Structural Correlation: Check if amount patterns repeat across different destination nodes.

    Transactions:
    ${historySnippet}
    
    Output JSON exactly:
    {
      "temporalFlag": boolean,
      "confidence": number, // Forensic Correlation Coefficient (0.0 to 1.0)
      "reason": "string (concise forensic verdict)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temporalFlag: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER, description: "Forensic Correlation Coefficient" },
            reason: { type: Type.STRING },
          },
          required: ['temporalFlag', 'confidence', 'reason']
        },
      }
    });
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error: any) {
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return { 
        temporalFlag: false, 
        confidence: 0, 
        reason: "QUOTA_EXCEEDED", 
        isError: true 
      };
    }
    return { temporalFlag: false, confidence: 0, reason: "Uplink Failed", isError: true };
  }
};

export const generateForensicReport = async (symbolicFacts: string[], suspectedWallets: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    ACT AS MASTER AI - FORENSIC INVESTIGATOR.
    TARGET NODES: ${suspectedWallets.join(', ')}
    SYMBOLIC FACTS:
    ${symbolicFacts.join('\n')}
    
    EXECUTIVE SUMMARY TASK:
    Reconstruct criminal intent and quantify obfuscation using professional RegTech terminology.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    return response.text || "Report generation resulted in empty output.";
  } catch (error: any) {
    return "Forensic report generation error.";
  }
};
