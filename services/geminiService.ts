
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface RenalCheckResult {
  requiresAdjustment: boolean;
  recommendation: string;
}

interface PediatricCheckResult {
  isSafe: boolean;
  message: string;
}

interface WeightBasedCheckResult {
  status: 'SAFE' | 'WARNING';
  message: string;
}

export const checkRenalDosing = async (
  drugName: string,
  egfr: string,
  renalMonographText: string,
  dose?: string,
  frequency?: string
): Promise<RenalCheckResult | null> => {
  // 1. Safety Checks: If data is missing or eGFR is invalid, return null (do nothing)
  if (!drugName || !egfr || !renalMonographText || egfr.includes('—') || egfr.includes('Pending')) {
    return null;
  }

  try {
    // 2. Define the response schema for structured JSON output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        requiresAdjustment: {
          type: Type.BOOLEAN,
          description: "True if the patient's eGFR indicates a need for dosing adjustment based on the guidelines.",
        },
        recommendation: {
          type: Type.STRING,
          description: "A concise clinical recommendation (max 15 words) derived strictly from the guidelines provided.",
        },
      },
      required: ["requiresAdjustment", "recommendation"],
    };

    // 3. Construct the prompt
    const prompt = `
      Act as a clinical pharmacist safety system.
      
      Patient Data:
      - eGFR: ${egfr}
      
      Drug Context:
      - Drug: ${drugName}
      - Renal Dosing Guidelines: "${renalMonographText}"
      - Prescribed Dose: ${dose || 'Not specified'} (IMPORTANT: This is the TOTAL dose per administration, e.g., '1g' or '500mg'. It is NOT a mg/kg value unless explicitly stated.)
      - Frequency: ${frequency || 'Not specified'}
      
      Task:
      Compare the patient's eGFR against the provided Renal Dosing Guidelines.
      Does the patient require a dose adjustment or specific interval change compared to standard normal renal function dosing?
      
      Rules:
      - If eGFR is within the "normal" or "no adjustment" range, requiresAdjustment is false.
      - If eGFR falls into a range requiring adjustment, requiresAdjustment is true.
      - Be conservative. If unsure, assume safety first.
      - Keep recommendation extremely concise (e.g., "Reduce to 1g q24h" or "Extend interval to q12h").
    `;

    // 4. Call the model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for consistent, factual answers
      },
    });

    // 5. Parse and return
    if (response.text) {
      let jsonStr = response.text.trim();
      // Handle potential Markdown code block wrapping
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      return JSON.parse(jsonStr) as RenalCheckResult;
    }
    return null;

  } catch (error) {
    console.error("Renal Check AI Error:", error);
    return null; // Fail silently in UI if API fails
  }
};

export const verifyPediatricDosing = async (
  drugName: string,
  weightKg: string,
  age: string,
  dose: string,
  frequency: string,
  monographText: string
): Promise<PediatricCheckResult | null> => {
  if (!drugName || !weightKg || !dose || !monographText) return null;

  try {
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isSafe: { type: Type.BOOLEAN, description: "True if the calculated dose is within safe limits per the monograph." },
        message: { type: Type.STRING, description: "A short message explaining the calculation check (e.g. 'Calculated: 15mg/kg/day. Safe range: 10-20.')." }
      },
      required: ["isSafe", "message"]
    };

    const prompt = `
      Act as a pediatric clinical pharmacist.
      
      Patient: ${age} years old, ${weightKg} kg.
      Prescription: ${drugName}, Dose: ${dose}, Frequency: ${frequency}.
      Monograph Guidelines: "${monographText}"

      Task:
      1. Calculate the daily dose in mg/kg/day based on the prescription.
      2. Compare against the Monograph Guidelines.
      3. Determine if it is therapeutically safe (not toxic, not significantly underdosed).

      Output JSON:
      - isSafe: boolean
      - message: "Calculated [X] mg/kg/day. Safe range/limit is [Y]. [Verdict]."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    if (response.text) {
      let jsonStr = response.text.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      return JSON.parse(jsonStr) as PediatricCheckResult;
    }
    return null;

  } catch (error) {
    console.error("Pediatric Check AI Error:", error);
    return null;
  }
};

export const verifyWeightBasedDosing = async (
  patientType: 'adult' | 'pediatric',
  drugName: string,
  weightKg: string,
  dose: string,
  frequency: string,
  monographText: string
): Promise<WeightBasedCheckResult | null> => {
  if (!drugName || !weightKg || !dose || !monographText) return null;

  try {
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["SAFE", "WARNING"], description: "SAFE if dose is appropriate, WARNING if under/overdose." },
        message: { type: Type.STRING, description: "A message explaining the calculation (e.g. '✅ Dose (~15mg/kg) is within range' or '⚠️ Overdose: 50mg/kg entered')." }
      },
      required: ["status", "message"]
    };

    const prompt = `
      Act as a clinical pharmacist.
      
      Context:
      - Patient Type: ${patientType}
      - Weight: ${weightKg} kg
      - Drug: ${drugName}
      - User Entry: Dose '${dose}', Frequency '${frequency}'
      - Monograph Rule: "${monographText}"
      
      Task:
      1. Parse the user's text dose into a number (handle 'g', 'mg').
      2. Calculate the resulting mg/kg (per dose or per day as appropriate for the drug).
      3. Compare with the Monograph Rule.
      
      Output Rules:
      - If the dose is reasonably within the therapeutic window, status is SAFE.
      - If the dose is significantly too high (toxic) or too low (ineffective), status is WARNING.
      - Be helpful and educational in the message.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    if (response.text) {
      let jsonStr = response.text.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      return JSON.parse(jsonStr) as WeightBasedCheckResult;
    }
    return null;

  } catch (error) {
    console.error("Weight Based Check AI Error:", error);
    return null;
  }
};
