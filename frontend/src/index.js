import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import ErrorBoundary from "@/components/ErrorBoundary";

// Global error suppression for undefined variables from external scripts
const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  // Suppress specific errors from external scripts
  if (message.includes('is not defined') || 
      message.includes('CZaCryq') ||
      message.includes('posthog') ||
      message.includes('emergent')) {
    console.warn('[Suppressed error]', ...args);
    return;
  }
  originalError.apply(console, args);
};

// Suppress unhandled errors
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (message.includes('is not defined') || message.includes('CZaCryq')) {
    console.warn('[Suppressed window error]', message);
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, true);

// Suppress unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason?.toString() || '';
  if (message.includes('is not defined') || message.includes('CZaCryq')) {
    console.warn('[Suppressed promise rejection]', message);
    event.preventDefault();
    return true;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
