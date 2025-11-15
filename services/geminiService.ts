import { GoogleGenAI } from "@google/genai";
import { GroundingChunk } from '../types';

// Initialize the Google Gemini AI client
// This requires the API_KEY to be set in the environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BACKEND_ENDPOINT = 'https://gemini-backend-ca0r.onrender.com/api/chat';

// System instruction for the direct Gemini call to extract structured place data
const placeExtractionInstruction = `
Tu única tarea es analizar el siguiente texto de un usuario que pregunta sobre turismo en Colombia.
Extrae una lista de TODOS los lugares turísticos específicos mencionados (ciudades, parques, monumentos, etc.).
Debes devolver la respuesta en un formato de array JSON estricto. Cada objeto en el array debe tener las propiedades "name", "city" y "department".
Ejemplo de formato de salida:
[
  {"name": "Catedral de Sal", "city": "Zipaquirá", "department": "Cundinamarca"},
  {"name": "Museo del Oro", "city": "Bogotá", "department": "Cundinamarca"}
]
Si no se encuentran lugares turísticos, devuelve un array vacío [].
NO incluyas ninguna otra palabra, explicación o texto fuera del array JSON.
`;


export async function runChat(prompt: string, location: { latitude: number; longitude: number } | null) {
  try {
    // --- Step 1: Get the primary text response from the user's custom backend ---
    const backendResponse = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });

    if (!backendResponse.ok) {
      throw new Error(`Error from backend: ${backendResponse.statusText}`);
    }
    const backendData = await backendResponse.json();
    const responseText = backendData.reply || "No he recibido una respuesta válida de mi servidor.";

    // --- Step 2: Make a parallel, direct call to Gemini to extract structured place data ---
    let placesInfo: { name: string; city: string; department: string }[] = [];
    try {
        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: placeExtractionInstruction,
            }
        });

      const rawJson = geminiResponse.text.trim();
      // Clean the response to ensure it's valid JSON
      const cleanedJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      
      if (cleanedJson) {
        placesInfo = JSON.parse(cleanedJson);
      }
    } catch (e) {
      console.error("Could not extract place data from Gemini:", e);
      // If this fails, we still have the main response, so we don't throw an error.
      placesInfo = [];
    }

    // Grounding chunks are not supported in this hybrid model
    const groundingChunks: GroundingChunk[] = [];

    return { responseText, placesInfo, groundingChunks };

  } catch (error) {
    console.error('Error in runChat function:', error);
    return { 
        responseText: "Lo siento, tengo problemas para conectarme con mi servidor. Por favor, asegúrate de que esté en funcionamiento e inténtalo de nuevo.",
        placesInfo: [],
        groundingChunks: []
    };
  }
}