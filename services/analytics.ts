import { getEnv } from './utils';

// Simple wrapper for Google Analytics
const GA_ID = getEnv('GOOGLE_ANALYTICS_ID');

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  if (!GA_ID || GA_ID === 'G-XXXXXXXXXX' || GA_ID.length < 5) {
    console.log("[Analytics] No valid ID provided (Skeleton Mode).");
    return;
  }

  // Prevent double loading
  if (document.getElementById('google-analytics-script')) return;

  try {
      const script = document.createElement('script');
      script.id = 'google-analytics-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]){ (window.dataLayer as any[]).push(args); }
      gtag('js', new Date());
      gtag('config', GA_ID);
      
      console.log(`[Analytics] Initialized with ID: ${GA_ID}`);
  } catch (e) {
      console.warn("Failed to init analytics script", e);
  }
};

export const logEvent = (eventName: string, params?: Record<string, any>) => {
    try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', eventName, params);
        } else {
            console.log(`[Analytics Mock] Event: ${eventName}`, params);
        }
    } catch (e) {
        // Ignore analytics errors
    }
};

export const AnalyticsEvents = {
    APP_OPEN: 'app_open',
    LOGIN: 'login',
    LOGOUT: 'logout',
    SEND_MESSAGE: 'send_message',
    COMPLETE_LESSON: 'complete_lesson',
    ERROR: 'error'
};

// Add types for window
declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}