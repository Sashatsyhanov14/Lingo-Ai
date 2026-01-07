
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Load env vars from .env files (local development)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // 2. Prioritize Vercel system variables (process.env) over .env files
  // This is crucial because Vercel injects secrets into process.env, not into the file loader
  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || env.API_KEY || env.VITE_API_KEY;

  console.log(`[Vite Build] API Key status: ${apiKey ? 'Found ✅' : 'Missing ❌'}`);

  return {
    plugins: [react()],
    base: './', 
    define: {
      // 3. Hardcode the found key into the frontend bundle
      // This replaces 'process.env.API_KEY' with the actual string '"sk-..."' in your compiled code
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_API_KEY': JSON.stringify(apiKey),
      // Fallback object for safety
      'process.env': JSON.stringify({}),
    },
    server: {
      host: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    }
  };
});
