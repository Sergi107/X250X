import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import path from 'node:path';

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    react() 
  ],
  vite: {
    plugins: [tailwindcss()], 
    server: {
      watch: {
        // USAMOS RUTA ABSOLUTA PARA QUE WINDOWS NO FALLE
        ignored: [
          path.resolve(process.cwd(), 'admin_metadata.json')
        ]
      }
    }
  }
});