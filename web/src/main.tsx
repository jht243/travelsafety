import React from "react";
import { createRoot } from "react-dom/client";

import TravelSafety from "./TravelSafety";

const container = document.getElementById("is-it-safe-root");

if (!container) {
  throw new Error("is-it-safe-root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <TravelSafety />
  </React.StrictMode>
);
