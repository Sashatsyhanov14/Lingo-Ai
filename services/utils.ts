
/**
 * Safely retrieves environment variables handling both process.env and Vite's import.meta.env
 * Checks for the exact key first, then tries the VITE_ prefix.
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
  try {
    // 1. Try Vite's import.meta.env (modern frontend)
    // We check for the exact key AND the VITE_ prefixed key
    const meta = import.meta as any;
    if (meta && meta.env) {
        if (meta.env[key]) return meta.env[key];
        if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
    }
    
    // 2. Try direct process.env (Node/Webpack/Legacy/Vercel Polyfill)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
      if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
    }
    
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};
