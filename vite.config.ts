import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Vite copia public/ tal cual, pero su servidor de desarrollo no resuelve el index.html
// de una carpeta: /2023/ y /calendar-reminder/ se quedaban sin servir, o peor, con el
// desvío de una sola página, devolvían el producto y el enlace a 2023 parecía roto.
// Vercel sí los resuelve, así que esto es solo para que desarrollo se parezca a producción.
const indicesDeCarpeta = (): Plugin => ({
  name: 'indices-de-carpeta',
  apply: 'serve',
  configureServer(servidor) {
    servidor.middlewares.use((peticion, _respuesta, siguiente) => {
      // Sin @types/node, `url` no figura en el tipo de la petición; en ejecución sí está.
      const p = peticion as { url?: string };
      if (p.url && p.url !== '/' && p.url.endsWith('/')) p.url += 'index.html';
      siguiente();
    });
  },
});

export default defineConfig({
  plugins: [react(), indicesDeCarpeta()],
  appType: 'mpa',
});
