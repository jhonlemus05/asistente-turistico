# Asistente Turístico de Colombia (IA)

Este es un proyecto de asistente turístico interactivo para Colombia, diseñado para ayudar a los usuarios a planificar sus viajes, explorar destinos y obtener información relevante sobre el país. Utiliza un chatbot impulsado por IA para responder preguntas y ofrecer recomendaciones personalizadas.

## Características

- **Chatbot Inteligente:** Responde preguntas sobre destinos, cultura, gastronomía y más.
- **Destinos Populares:** Información detallada sobre los destinos turísticos más importantes.
- **Diseño Atractivo:** Interfaz de usuario moderna y fácil de usar.

## Arquitectura Frontend

El frontend está construido con **React** y **TypeScript**, utilizando **Vite** como herramienta de empaquetado y desarrollo. La estructura del proyecto está organizada para separar la lógica de la interfaz de usuario (componentes) de los servicios que interactúan con APIs externas.

### Estructura de Carpetas

```
/
├── src/
│   ├── components/      # Componentes reutilizables de React
│   ├── services/        # Lógica para interactuar con APIs (Gemini, etc.)
│   ├── App.tsx          # Componente principal de la aplicación
│   └── index.tsx        # Punto de entrada de la aplicación
├── public/              # Archivos estáticos
├── .env.local           # Variables de entorno locales (no versionadas)
├── package.json         # Dependencias y scripts del proyecto
└── vite.config.ts       # Configuración de Vite
```

### Componentes Principales (`src/components`)

- **`Navbar.tsx`**: Barra de navegación superior.
- **`Hero.tsx`**: Sección principal de bienvenida o "héroe".
- **`About.tsx`**: Sección con información sobre el proyecto.
- **`Destinations.tsx`**: Muestra una lista de destinos turísticos.
- **`Stats.tsx`**: Muestra estadísticas o datos de interés.
- **`Chatbot.tsx`**: Contiene la lógica y la interfaz del chatbot.
- **`ChatBubble.tsx`**: Burbujas de mensaje para el chat.
- **`Contact.tsx`**: Sección o formulario de contacto.
- **`Footer.tsx`**: Pie de página de la aplicación.

### Servicios (`src/services`)

- **`geminiService.ts`**: Encapsula la lógica para comunicarse con la API de Google Gemini, enviando las preguntas del usuario y recibiendo las respuestas del modelo de IA.
- **`imageSearchService.ts`**: (Opcional) Podría usarse para buscar imágenes relacionadas con los destinos turísticos.

## Instalación y Uso

**Requisitos previos:** [Node.js](https://nodejs.org/) y [npm](https://www.npmjs.com/).

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/asistente-turistico-colombia-ia.git
    cd asistente-turistico-colombia-ia
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar la clave de API:**
    - Crea un archivo `.env.local` en la raíz del proyecto.
    - Agrega tu clave de API de Google Gemini:
      ```
      VITE_GEMINI_API_KEY=TU_API_KEY
      ```

4.  **Ejecutar la aplicación:**
    Para iniciar el servidor de desarrollo, ejecuta:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

### Scripts Disponibles

En el archivo `package.json` encontrarás los siguientes scripts:

- **`npm run dev`**: Inicia el servidor de desarrollo de Vite con Hot-Reload.
- **`npm run build`**: Compila y empaqueta la aplicación para producción en la carpeta `dist/`.
- **`npm run preview`**: Sirve la versión de producción (generada con `npm run build`) localmente para previsualización.


