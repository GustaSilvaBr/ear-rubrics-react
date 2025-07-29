import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Variável para armazenar a instância do Firebase App
export let app: FirebaseApp; // Exporta a instância do app Firebase

// Define a interface para o contexto do Firebase
interface FirebaseContextType {
  db: Firestore | null;
  auth: Auth | null;
  userId: string | null;
  teacherEmail: string | null; // Adicionado teacherEmail ao contexto
  teacherName: string | null;  // Adicionado teacherName ao contexto
  isAuthReady: boolean;
}

// Crie o contexto com valores iniciais nulos
const FirebaseContext = createContext<FirebaseContextType>({
  db: null,
  auth: null,
  userId: null,
  teacherEmail: null, // Valor inicial
  teacherName: null,  // Valor inicial
  isAuthReady: false,
});

// Hook customizado para usar o contexto do Firebase
export const useFirebase = () => useContext(FirebaseContext);

// Provedor do Firebase
interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null); // Estado para teacherEmail
  const [teacherName, setTeacherName] = useState<string | null>(null);    // Estado para teacherName
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null); // Adicionado estado de erro local

  useEffect(() => {
    let firestore: Firestore;
    let firebaseAuth: Auth;

    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : {};
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      // Use as variáveis de ambiente do Vite para o ambiente local
      const localFirebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
        appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
      };

      const localAppId = import.meta.env.VITE_APP_ID || appId;
      const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || (typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null);

      if (!localFirebaseConfig.projectId) {
        console.error("Firebase Initialization Error: 'projectId' not found in firebase configuration. Please ensure it's provided via Canvas global variables or .env file.");
        setError("Firebase configuration missing projectId. Cannot connect to database.");
        setIsAuthReady(true);
        setUserId(crypto.randomUUID());
        return;
      }

      // Inicializa o Firebase App e atribui à variável exportada
      app = initializeApp(localFirebaseConfig, localAppId);
      firestore = getFirestore(app);
      firebaseAuth = getAuth(app); // Passa a instância do app explicitamente

      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setTeacherEmail(user.email);       // Salva o email do usuário
          setTeacherName(user.displayName); // Salva o nome de exibição do usuário
        } else {
          setUserId(null); // Limpa o userId se não houver usuário
          setTeacherEmail(null); // Limpa o email
          setTeacherName(null);  // Limpa o nome
          try {
            if (initialAuthToken) {
              const userCredential = await signInWithCustomToken(firebaseAuth, initialAuthToken);
              setUserId(userCredential.user.uid);
              setTeacherEmail(userCredential.user.email);
              setTeacherName(userCredential.user.displayName);
            } else {
              const userCredential = await signInAnonymously(firebaseAuth);
              setUserId(userCredential.user.uid);
              // Usuários anônimos geralmente não têm email/displayName, mas podemos definir como null
              setTeacherEmail(null);
              setTeacherName("Anonymous User"); // Nome padrão para anônimos
            }
          } catch (authError) {
            console.error("Firebase authentication error:", authError);
            setUserId(crypto.randomUUID()); // Fallback para ID aleatório em caso de erro
            setTeacherEmail(null);
            setTeacherName(null);
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
      setTeacherEmail(null);
      setTeacherName(null);
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, teacherEmail, teacherName, isAuthReady }}>
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
