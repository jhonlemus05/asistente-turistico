// services/geminiService.ts

export const BACKEND_ENDPOINT =
  import.meta.env.VITE_BACKEND_URL || "https://gemini-backend-ca0r.onrender.com/api/chat";

/**
 * Reformatea el texto de respuesta para hacerlo más limpio.
 */
async function reformatText(text: string): Promise<string> {
  try {
    const formatted = text
      .replace(/\s+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();
    return formatted;
  } catch {
    return text;
  }
}

/**
 * Extrae posibles lugares de la respuesta usando heurística básica.
 * (Para mantener tu proyecto funcional sin dependencias adicionales).
 */
async function extractPlaces(text: string) {
  const placeRegex = /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)\b/g;

  const commonWords = [
    "Colombia", "Turismo", "Historia", "Región", "Cultura",
    "Visita", "Lugar", "Sitio"
  ];

  const matches = text.match(placeRegex) || [];

  const filtered = matches
    .filter(p => !commonWords.includes(p))
    .map(name => ({ name }));

  return filtered.slice(0, 3); // máximo 3 lugares
}

export async function runChat(
  prompt: string,
  location: { latitude: number; longitude: number } | null
) {
  try {
    // --- 1. Llamada a tu propio backend (Render) ---
    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    if (!response.ok) throw new Error("Error en el backend");

    const data = await response.json();
    const rawText = data.reply || "Respuesta no válida del servidor.";

    // --- 2. Ejecutar análisis en paralelo ---
    const [formatted, places] = await Promise.all([
      reformatText(rawText),
      extractPlaces(rawText),
    ]);

    return {
      responseText: formatted,
      placesInfo: places,
      groundingChunks: [], // para compatibilidad futura
    };
  } catch (error) {
    console.error("Error en runChat:", error);
    return {
      responseText: "Lo siento, ocurrió un error procesando la solicitud.",
      placesInfo: [],
      groundingChunks: [],
    };
  }
}
