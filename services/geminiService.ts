import { GoogleGenAI } from "@google/genai";
import { GroundingChunk } from '../types';
import { searchImageForPlace } from './imageSearchService';

let ai: GoogleGenAI | null = null;

// Lazy initialization of the Google Gemini AI client
function getAiClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
}

const BACKEND_ENDPOINT = 'https://gemini-backend-ca0r.onrender.com/api/chat';

// System instruction for the direct Gemini call to extract structured place data
const placeExtractionInstruction = `
Tu única tarea es analizar el siguiente texto sobre turismo en Colombia.
Extrae una lista de ALGUNOS de los lugares turísticos específicos mencionados (ciudades, parques, monumentos, etc.).
Debes devolver la respuesta en un formato de array JSON estricto. Cada objeto en el array debe tener las propiedades "name", "city" y "department".
Ejemplo de formato de salida:
[
  {"name": "Catedral de Sal", "city": "Zipaquirá", "department": "Cundinamarca"},
  {"name": "Museo del Oro", "city": "Bogotá", "department": "Cundinamarca"}
]
Si no se encuentran lugares turísticos, devuelve un array vacío [].
NO incluyas ninguna otra palabra, explicación o texto fuera del array JSON.
`;

const textReformattingInstruction = `
Eres un asistente de viajes para Colombia. Tu tarea es reformatear el siguiente texto para que sea más amigable, conciso y visualmente atractivo. Sigue estas reglas estrictamente:
1. Usa emojis relevantes para resaltar puntos clave (playas 🏖️, montañas ⛰️, café ☕, etc.).
2. Acorta las oraciones y usa párrafos breves.
3. Si hay una lista de lugares o actividades, formatéala usando viñetas (usando '*' o '-').
4. Mantén un tono entusiasta y servicial.
5. NO inventes información nueva, solo reformatea el texto proporcionado.
6. El texto debe estar en español.
`;

/**
 * Uses Gemini to reformat text to be more user-friendly.
 * @param textToFormat The original text from the backend.
 * @returns A promise that resolves to the reformatted text.
 */
async function reformatText(textToFormat: string): Promise<string> {
    if (!textToFormat.trim()) return textToFormat;
    try {
        const geminiClient = getAiClient();
        const response = await geminiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: textToFormat,
            config: {
                systemInstruction: textReformattingInstruction,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error reformatting text with Gemini:", error);
        return textToFormat; // Fallback to original text on error
    }
}


export async function runChat(prompt: string, location: { latitude: number; longitude: number } | null) {
  try {
    // --- Step 1: Get the detailed response from the custom backend ---
    const backendResponse = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });
    if (!backendResponse.ok) {
      throw new Error(`Error from backend: ${backendResponse.statusText}`);
    }
    const backendData = await backendResponse.json();
    const rawResponseText = backendData.reply || "No he recibido una respuesta válida de mi servidor.";

    // --- Step 2 (Parallel): Reformat text AND extract places from the backend's response ---
    const reformatPromise = reformatText(rawResponseText);

    const placesPromise = (async () => {
      let placesInfo: { name: string; city: string; department: string }[] = [];
      if (!rawResponseText.trim()) return placesInfo;
      try {
          const geminiClient = getAiClient();
          const geminiResponse = await geminiClient.models.generateContent({
              model: "gemini-2.5-flash",
              contents: rawResponseText, // CRITICAL CHANGE: Use backend response text
              config: { systemInstruction: placeExtractionInstruction }
          });
        const rawJson = geminiResponse.text.trim();
        const cleanedJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleanedJson) {
          placesInfo = JSON.parse(cleanedJson);
        }
      } catch (e) {
        console.error("Could not extract place data from Gemini:", e);
      }
      return placesInfo;
    })();

    // --- Step 3: Await the parallel tasks ---
    const [responseText, placesInfo] = await Promise.all([
        reformatPromise,
        placesPromise,
    ]);

    // --- Step 4: Orchestrate visual and interactive content ---
    let imageUrl: string | null = null;
    const mapLinks: { name: string, url: string }[] = [];

    if (placesInfo && placesInfo.length > 0) {
      const imageUrlPromise = searchImageForPlace(placesInfo[0].name);
      
      for (const place of placesInfo) {
          const queryParts = [place.name, place.city, place.department, "Colombia"].filter(Boolean);
          const fullQuery = queryParts.join(', ');
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
          mapLinks.push({ name: place.name, url: mapUrl });
      }

      imageUrl = await imageUrlPromise;
    }

    const groundingChunks: GroundingChunk[] = [];

    return { responseText, imageUrl, mapLinks, groundingChunks };

  } catch (error) {
    console.error('Error in runChat function:', error);
    return { 
        responseText: "Lo siento, tengo problemas para conectarme con mi servidor. Por favor, asegúrate de que esté en funcionamiento e inténtalo de nuevo.",
        imageUrl: null,
        mapLinks: [],
        groundingChunks: []
    };
  }
}