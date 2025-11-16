// services/imageSearchService.ts

export async function searchImage(query: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=600&origin=*&titles=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    const data = await response.json();

    const pages = data.query.pages;
    const page = pages[Object.keys(pages)[0]];

    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }

    return null; // sin imagen encontrada
  } catch (error) {
    console.error("Error en búsqueda Wikimedia:", error);
    return null;
  }
}
