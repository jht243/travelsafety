import React from "react";
import { createRoot } from "react-dom/client";

import TravelSafety from "./TravelSafety";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center", fontFamily: "sans-serif", color: "#DC2626", wordBreak: "break-word" }}>
          <h3>Something went wrong.</h3>
          <p>Please try refreshing the page.</p>
          <details style={{ marginTop: 10, textAlign: "left", fontSize: "12px", color: "#666" }}>
            <summary>Debug Error Details</summary>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 10, borderRadius: 4 }}>
              {(this.state as any).error?.toString()}
              <br />
              {(this.state as any).error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("[Main] Travel Safety App loading...");

const container = document.getElementById("travel-safety-root") || document.getElementById("travel-checklist-root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <TravelSafety />
    </ErrorBoundary>
  </React.StrictMode>
);
