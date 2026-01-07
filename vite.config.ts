
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Load env vars from .env files (local development)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // 2. Aggressively find the key (check Vercel system vars AND .env files)
  // We check multiple common naming conventions to be safe, INCLUDING VITE_OPENROUTER_API_KEY
  const apiKey = 
    process.env.API_KEY || 
    process.env.VITE_API_KEY || 
    process.env.OPENROUTER_API_KEY || 
    process.env.VITE_OPENROUTER_API_KEY || 
    env.API_KEY || 
    env.VITE_API_KEY || 
    env.OPENROUTER_API_KEY ||
    env.VITE_OPENROUTER_API_KEY;

  console.log(`[Vite Build] API Key detection: ${apiKey ? 'SUCCESS ✅' : 'FAILED ❌ (Check Vercel Settings)'}`);

  return {
    plugins: [react()],
    base: './', 
    define: {
      // 3. Inject the key as a global constant
      // This bypasses 'process.env' confusion entirely
      '__API_KEY__': JSON.stringify(apiKey),
      
      // Fallbacks for libraries that might expect process.env
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(apiKey),
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
