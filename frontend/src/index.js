import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import ErrorBoundary from "@/components/ErrorBoundary";

// Suppress any global undefined variable errors from external scripts
window.onerror = function(message, source, lineno, colno, error) {
  // Ignore errors from external scripts
  if (source && (source.includes('emergent') || source.includes('posthog'))) {
    console.warn('Suppressed external script error:', message);
    return true;
  }
  // Log but don't crash for undefined variable errors
  if (message && message.includes('is not defined')) {
    console.warn('Suppressed undefined variable error:', message);
    return true;
  }
  return false;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
