import { GoogleGenerativeAI } from "@google/generative-ai";

// Forzamos la inicialización con la versión de la API específica
const genAI = new GoogleGenerativeAI(import.meta.env.GOOGLE_API_KEY || "");

export async function processMissionWithLLM(rawText: string) {
    try {
        if (!import.meta.env.GOOGLE_API_KEY) throw new Error("API Key faltante");

        // Usamos el modelo 2.0 Flash Experimental que es extremadamente rápido
        // Configuramos el modelo aquí dentro para asegurar que use los parámetros correctos
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp" 
        });

        const prompt = `
        Analiza este mensaje de Discord de una comunidad de simulación militar (Arma 3).
        Extrae la información y devuélvela estrictamente en formato JSON.
        
        Campos requeridos:
        {
          "title": "Nombre de la misión",
          "faction": "Facción jugable",
          "location": "Mapa o isla",
          "date": "Fecha y hora de la operación",
          "context": "Resumen narrativo del briefing (máximo 3 frases)"
        }

        Mensaje a procesar:
        ${rawText}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Limpiamos el posible markdown de la respuesta de la IA
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("❌ Error en el procesador Gemini:", error);
        
        // Si el error es un 404 persistente, devolvemos un objeto de seguridad
        return {
            title: "Error de Inteligencia",
            faction: "N/A",
            location: "N/A",
            date: "N/A",
            context: "El sistema de IA no ha podido procesar este mensaje. Verifica que el modelo 'gemini-2.0-flash-exp' esté disponible en tu región."
        };
    }
}