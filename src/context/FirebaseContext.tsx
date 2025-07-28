// src/context/FirebaseContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  db: Firestore | null;
  auth: Auth | null;
  userId: string | null;
  isAuthReady: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
});

export const useFirebase = () => useContext(FirebaseContext);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null); // Adicionado estado de erro local

  useEffect(() => {
    let app: FirebaseApp;
    let firestore: Firestore;
    let firebaseAuth: Auth;

    try {
      // Tenta ler as variáveis globais do Canvas primeiro
      let configFromCanvas = {};
      let appIdFromCanvas = 'default-app-id';
      let initialAuthTokenFromCanvas: string | null = null;

      if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        configFromCanvas = JSON.parse(__firebase_config);
      }
      if (typeof __app_id !== 'undefined') {
        appIdFromCanvas = __app_id;
      }
      if (typeof __initial_auth_token !== 'undefined') {
        initialAuthTokenFromCanvas = __initial_auth_token;
      }

      // Use as variáveis de ambiente do Vite para o ambiente local
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      };

      const appId = import.meta.env.VITE_APP_ID || appIdFromCanvas; // Você pode definir VITE_APP_ID no .env também
      const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || initialAuthTokenFromCanvas; // Se você tiver um token para testes locais

      // Verifica se o projectId está presente na configuração do Firebase
      if (!firebaseConfig.projectId) {
        console.error("Firebase Initialization Error: 'projectId' not found in firebase configuration. Please ensure it's provided via Canvas global variables or .env file.");
        setError("Firebase configuration missing projectId. Cannot connect to database.");
        setIsAuthReady(true);
        setUserId(crypto.randomUUID()); // Fallback para um ID de usuário aleatório
        return; // Sai da função se a configuração for inválida
      }

      // Inicializa o Firebase App
      app = initializeApp(firebaseConfig, appId);
      firestore = getFirestore(app);
      firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      // Listener para mudanças no estado de autenticação
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (initialAuthToken) {
              const userCredential = await signInWithCustomToken(firebaseAuth, initialAuthToken);
              setUserId(userCredential.user.uid);
            } else {
              const userCredential = await signInAnonymously(firebaseAuth);
              setUserId(userCredential.user.uid);
            }
          } catch (authError) {
            console.error("Firebase authentication error:", authError);
            setUserId(crypto.randomUUID());
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (initError) {
      console.error("Failed to initialize Firebase:", initError);
      setError("Failed to initialize Firebase. Please check console for details.");
      setIsAuthReady(true);
      setUserId(crypto.randomUUID());
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, isAuthReady }}>
      {error ? (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red', borderRadius: '5px', margin: '20px' }}>
          <p>Error: {error}</p>
          <p>Please ensure your Firebase credentials are correctly configured in a `.env` file for local development, or provided by the Canvas environment.</p>
        </div>
      ) : (
        children
      )}
    </FirebaseContext.Provider>
  );
};