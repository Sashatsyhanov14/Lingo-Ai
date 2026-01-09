import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Analytics } from '@vercel/analytics/react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
      <Analytics />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Critical Render Error:", e);
  // Fallback UI in case of total crash
  rootElement.innerHTML = '<div style="color:white; padding: 20px; text-align: center;">Something went wrong. Please reload.</div>';
}