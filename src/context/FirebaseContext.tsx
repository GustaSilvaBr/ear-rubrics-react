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
  teacherEmail: string | null;
  teacherName: string | null;
  isAuthReady: boolean;
}

// Crie o contexto com valores iniciais nulos
const FirebaseContext = createContext<FirebaseContextType>({
  db: null,
  auth: null,
  userId: null,
  teacherEmail: null,
  teacherName: null,
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
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let firestore: Firestore;
    let firebaseAuth: Auth;

    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : {};
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
        console.error("Erro de inicialização do Firebase: 'projectId' não encontrado na configuração. Certifique-se de que é fornecido via variáveis globais do Canvas ou arquivo .env.");
        setError("Configuração do Firebase ausente projectId. Não é possível conectar ao banco de dados.");
        setIsAuthReady(true);
        setUserId(null); // Define como null se a inicialização falhar
        return;
      }

      app = initializeApp(localFirebaseConfig, localAppId);
      firestore = getFirestore(app);
      firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setTeacherEmail(user.email);
          setTeacherName(user.displayName);
        } else {
          // Se não houver usuário logado (e não há token inicial), não tente signInAnonymously.
          // Apenas defina userId como null.
          setUserId(null); // IMPORTANTE: Define userId como null para usuários não logados
          setTeacherEmail(null);
          setTeacherName(null);
          // Não há necessidade de try-catch aqui, pois não estamos chamando uma operação de autenticação
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (initError) {
      console.error("Falha ao inicializar o Firebase:", initError);
      setError("Falha ao inicializar o Firebase. Por favor, verifique o console para detalhes.");
      setIsAuthReady(true);
      setUserId(null); // Define como null se a inicialização falhar
      setTeacherEmail(null);
      setTeacherName(null);
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, teacherEmail, teacherName, isAuthReady }}>
      {error ? (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red', borderRadius: '5px', margin: '20px' }}>
          <p>Erro: {error}</p>
          <p>Certifique-se de que suas credenciais do Firebase estão configuradas corretamente em um arquivo `.env` para desenvolvimento local, ou fornecidas pelo ambiente Canvas.</p>
        </div>
      ) : (
        children
      )}
    </FirebaseContext.Provider>
  );
};
