import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ARCHIVE_PATH = path.resolve("./src/data/mission_archive.json");

// Asegurar que el archivo existe
if (!fs.existsSync(ARCHIVE_PATH)) {
  fs.writeFileSync(ARCHIVE_PATH, JSON.stringify({}));
}

export async function processWithChatGPT(messageId: string, rawText: string) {
  // 1. Leer archivo actual
  const archive = JSON.parse(fs.readFileSync(ARCHIVE_PATH, "utf-8"));

  // 2. Si ya lo tenemos procesado, lo devolvemos sin llamar a la API
  if (archive[messageId]) {
    return archive[messageId];
  }

  // 3. Si es nuevo, pedimos a ChatGPT (usamos gpt-4o-mini: el más barato y rápido)
  console.log(`🤖 [GPT] Procesando nueva misión ID: ${messageId}`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un analista de inteligencia militar. Extrae datos de misiones de Arma 3 y responde exclusivamente en JSON."
        },
        {
          role: "user",
          content: `Extrae: title, faction, location, date, context (resumen corto). Texto: ${rawText}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiData = JSON.parse(response.choices[0].message.content || "{}");

    // 4. Guardar en el archivo para la próxima vez
    archive[messageId] = aiData;
    fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(archive, null, 2));

    return aiData;
  } catch (error) {
    console.error("❌ Error OpenAI:", error);
    return null;
  }
}