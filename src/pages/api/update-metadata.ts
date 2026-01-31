// src/pages/api/update-metadata.ts
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = './admin_metadata.json';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { missionId, data } = body;

    // 1. Leer archivo existente (o crear vacío)
    let currentDB: any = {};
    try {
      const fileContent = await fs.readFile(DB_PATH, 'utf-8');
      currentDB = JSON.parse(fileContent);
    } catch (error) {
      // Si no existe, iniciamos vacío
    }

    // 2. Actualizar datos
    currentDB[missionId] = data;

    // 3. Guardar en disco
    await fs.writeFile(DB_PATH, JSON.stringify(currentDB, null, 2));

    return new Response(JSON.stringify({ success: true, db: currentDB }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error guardando metadatos:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
};