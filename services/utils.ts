
/**
 * Safely retrieves environment variables handling both process.env and Vite's import.meta.env
 * Checks for the exact key first, then tries the VITE_ prefix.
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
  try {
    // 1. Try Vite's import.meta.env (modern frontend standard)
    // Dynamic access import.meta.env[key] often fails in production builds due to bundling optimization.
    // We rely on direct access patterns or process.env shim provided by vite.config.ts
    const meta = import.meta as any;
    if (meta && meta.env) {
        if (meta.env[key]) return meta.env[key];
        if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
    }
    
    // 2. Try direct process.env (injected via vite define)
    // We check type to avoid "process is not defined" errors in strict browser environments
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
      if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
    }
    
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};
