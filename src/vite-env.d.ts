// src/vite-env.d.ts
/// <reference types="vite/client" />

// Declare as variáveis globais injetadas pelo ambiente Canvas
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | undefined;

// Declare as variáveis de ambiente do Vite
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_INITIAL_AUTH_TOKEN?: string; // Opcional para testes locais
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}