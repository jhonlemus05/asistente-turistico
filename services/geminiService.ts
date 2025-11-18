import { GroundingChunk } from '../types';
import { searchImageForPlace } from './imageSearchService';

const BACKEND_ENDPOINT = 'https://gemini-backend-ca0r.onrender.com/api/chat';

export async function runChat(prompt: string, location: { latitude: number; longitude: number } | null) {
  try {
    // Step 1: Get the structured response from the custom backend
    const backendResponse = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, location }), // Pass location to backend
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: backendResponse.statusText }));
      throw new Error(`Error del servidor: ${errorData.error || 'Error desconocido'}`);
    }

    const { reply, placesInfo } = await backendResponse.json();
    
    const responseText = reply || "No he recibido una respuesta válida de mi servidor.";

    // Step 2: Orchestrate visual and interactive content based on backend data
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

    return { responseText, imageUrl, mapLinks, groundingChunks };

  } catch (error) {
    console.error('Error in runChat function:', error);
    return { 
        responseText: `Lo siento, tengo problemas para conectarme con mi servidor. Por favor, asegúrate de que esté en funcionamiento e inténtalo de nuevo. (${error.message})`,
        imageUrl: null,
        mapLinks: [],
        groundingChunks: []
    };
  }
}
