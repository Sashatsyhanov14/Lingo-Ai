
/**
 * Safely retrieves environment variables handling both process.env and Vite's import.meta.env
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
  try {
    // 1. Try Vite's import.meta.env (modern frontend)
    // Note: We use string access to avoid TS errors if types aren't generated
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[`VITE_${key}`]) {
      return meta.env[`VITE_${key}`];
    }
    
    // 2. Try direct process.env (Node/Webpack/Legacy)
    if (typeof process !== 'undefined' && process.env) {
      // Check both raw key and VITE_ prefixed key
      return process.env[key] || process.env[`VITE_${key}`] || defaultValue;
    }
    
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};
