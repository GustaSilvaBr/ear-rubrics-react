// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.scss"; // <-- Add this import

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);