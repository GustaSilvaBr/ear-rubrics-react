// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import {FirebaseProvider} from './context/FirebaseContext'
import "./styles/global.scss"; // <-- Add this import

createRoot(document.getElementById("root")!).render(
  <FirebaseProvider>
    <App />
  </FirebaseProvider>
);