import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: './', // Ensures assets load correctly on any domain/subdirectory
    define: {
      // Explicitly expose specific environment variables to the client
      // This ensures 'process.env.API_KEY' is replaced by the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
      // Fallback: expose the whole object (less secure but reliable for this use case)
      'process.env': JSON.stringify(env),
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