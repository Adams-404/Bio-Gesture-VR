import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

export const getMoleculeExplanation = async (pdbId: string): Promise<string> => {
  try {
    // Instantiate inside function to prevent initialization race conditions
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const prompt = `Explain the biological significance, structure, and function of the protein with PDB ID "${pdbId}". Keep it concise (under 150 words) and suitable for a biology student.`;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to retrieve explanation. The AI service might be temporarily unavailable.";
  }
};

export const chatWithMolecule = async (history: ChatMessage[], newMessage: string, pdbId: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';
        const systemInstruction = `You are a helpful structural biology assistant. The user is currently looking at a 3D model of PDB ID: ${pdbId}. Answer their questions specifically about this molecule.`;
        
        // Contextualize the prompt with current state
        const prompt = `Context: User is viewing protein ${pdbId}.
        Question: ${newMessage}`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction
            }
        });

        return response.text || "I couldn't understand that.";
    } catch (error) {
        console.error("Gemini Chat Error", error);
        return "Error communicating with AI.";
    }
}