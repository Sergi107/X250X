// src/pages/api/save-metadata.ts
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), "admin_metadata.json");

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Obtener los datos nuevos del frontend
        const body = await request.json();
        const { missionName, data } = body;

        if (!missionName || !data) {
            return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400 });
        }

        // 2. Leer el archivo actual de forma segura
        // CORRECCIÓN AQUI: Definimos el tipo explícitamente para evitar el error de TypeScript
        let currentDb: Record<string, any> = {}; 

        try {
            // Verificamos si existe antes de leer
            await fs.access(DB_PATH);
            const fileContent = await fs.readFile(DB_PATH, 'utf-8');
            // Si el archivo está vacío o corrupto, iniciamos como objeto vacío
            currentDb = fileContent ? JSON.parse(fileContent) : {};
        } catch (readError) {
            // Si el archivo no existe o falla el parseo, creamos uno nuevo
            console.log("⚠️ Creando nueva base de datos de metadatos...");
            currentDb = {};
        }

        // 3. Actualizar SOLO la misión específica
        const cleanKey = missionName.trim();
        
        currentDb[cleanKey] = {
            ...currentDb[cleanKey], // Mantener datos viejos si los hubiera
            ...data,                // Sobrescribir con datos nuevos
            lastUpdated: new Date().toISOString()
        };

        // 4. Reescribir EL ARCHIVO COMPLETO
        await fs.writeFile(DB_PATH, JSON.stringify(currentDb, null, 2), 'utf-8');

        return new Response(JSON.stringify({ success: true, mission: cleanKey }), { status: 200 });

    } catch (error) {
        console.error("❌ Error guardando metadata:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
    }
}