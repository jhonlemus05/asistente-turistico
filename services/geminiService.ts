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

/**
 * Extracts structured place data from text using Gemini.
 * @param textToAnalyze The text to extract places from.
 * @returns A promise that resolves to an array of places.
 */
async function extractPlaces(textToAnalyze: string): Promise<{ name: string; city: string; department: string }[]> {
    if (!textToAnalyze.trim()) return [];
    try {
        const geminiClient = getAiClient();
        const geminiResponse = await geminiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: textToAnalyze,
            config: { systemInstruction: placeExtractionInstruction }
        });
        const rawJson = geminiResponse.text.trim();
        const cleanedJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleanedJson) {
            return JSON.parse(cleanedJson);
        }
        return [];
    } catch (e) {
        console.error("Could not extract place data from Gemini:", e);
        // Throw an error to be caught by Promise.allSettled
        throw new Error("Error al extraer datos de lugares. Revisa la clave de API en el entorno de despliegue.");
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

    // --- Step 2: Concurrently reformat text AND extract places ---
    const [reformatResult, placesResult] = await Promise.allSettled([
        reformatText(rawResponseText),
        extractPlaces(rawResponseText),
    ]);

    // Use the reformatted text if successful, otherwise fallback to the raw text
    const responseText = reformatResult.status === 'fulfilled' ? reformatResult.value : rawResponseText;
    
    // Check if place extraction failed and prepare a user-facing warning
    let warningMessage = '';
    if (placesResult.status === 'rejected') {
        warningMessage = `<br><br><small><em>⚠️ No pude generar imágenes ni mapas. Esto puede deberse a un problema de configuración del servidor (ej. falta de API Key).</em></small>`;
    }

    const placesInfo = placesResult.status === 'fulfilled' ? placesResult.value : [];
    
    // --- Step 3: Orchestrate visual and interactive content ---
    let imageUrl: string | null = null;
    const mapLinks: { name: string, url: string }[] = [];

    if (placesInfo && placesInfo.length > 0) {
      // Fetch image for the first place found
      imageUrl = await searchImageForPlace(placesInfo[0].name);
      
      // Create map links for all found places
      for (const place of placesInfo) {
          const queryParts = [place.name, place.city, place.department, "Colombia"].filter(Boolean);
          const fullQuery = queryParts.join(', ');
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
          mapLinks.push({ name: place.name, url: mapUrl });
      }
    }

    const groundingChunks: GroundingChunk[] = [];

    // Append the warning message if there was an error
    return { responseText: responseText + warningMessage, imageUrl, mapLinks, groundingChunks };

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
