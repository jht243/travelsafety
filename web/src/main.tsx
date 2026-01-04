import React from "react";
import { createRoot } from "react-dom/client";

import TravelSafety from "./TravelSafety";

// Hydration helper - reads data from window.openai
const getHydrationData = (): any => {
  if (typeof window === "undefined") return {};
  
  const oa = (window as any).openai;
  if (!oa) {
    console.log("[Hydration] window.openai not found");
    return {};
  }

  console.log("[Hydration] window.openai found:", Object.keys(oa));

  // Check multiple sources for data
  const candidates = [
    oa.toolOutput,
    oa.structuredContent,
    oa.result?.structuredContent,
    oa.toolInput
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && Object.keys(candidate).length > 0) {
      console.log("[Hydration] Found data:", candidate);
      return candidate;
    }
  }

  return {};
};

const container = document.getElementById("is-it-safe-root");

if (!container) {
  throw new Error("is-it-safe-root element not found");
}

const root = createRoot(container);

const renderApp = (data: any) => {
  root.render(
    <React.StrictMode>
      <TravelSafety initialData={data} />
    </React.StrictMode>
  );
};

// Initial render with hydration data
const initialData = getHydrationData();
renderApp(initialData);

// Listen for late hydration events
window.addEventListener("openai:set_globals", (ev: any) => {
  const globals = ev?.detail?.globals;
  if (globals) {
    console.log("[Hydration] Late event received:", globals);
    const candidates = [
      globals.toolOutput,
      globals.structuredContent,
      globals.result?.structuredContent,
      globals.toolInput
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === "object" && Object.keys(candidate).length > 0) {
        console.log("[Hydration] Re-rendering with:", candidate);
        renderApp(candidate);
        return;
      }
    }
  }
});
