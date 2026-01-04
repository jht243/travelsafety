import React from "react";
import { createRoot } from "react-dom/client";

import MinimalTest from "./MinimalTest";

const container = document.getElementById("is-it-safe-root");

if (!container) {
  throw new Error("is-it-safe-root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MinimalTest />
  </React.StrictMode>
);
