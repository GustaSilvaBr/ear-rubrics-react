// src/pages/Login/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../../auth"; // Importe apenas signInWithGoogle
import { useFirebase } from "../../context/FirebaseContext";
import styles from "./Login.module.scss";

export function Login() {
  const navigate = useNavigate();
  const { auth, isAuthReady } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se o usuário já estiver autenticado (listener para mudanças de estado)
  useEffect(() => {
    if (isAuthReady && auth?.currentUser) {
      navigate("/");
    }
  }, [auth, isAuthReady, navigate]);

  const handleGoogleLogin = async () => {
    if (!auth) { // Garante que a instância auth está disponível
      setError("Firebase Auth not initialized. Please try again later.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle(auth);
      // Redireciona explicitamente após o login bem-sucedido
      navigate("/"); // <--- Adicionado para redirecionamento imediato
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <g>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.62-6.62C34.52 2.11 29.38 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C13.51 12.33 18.49 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.5c0-1.57-.15-3.09-.38-4.55H24v9.01h12.94c-.71 4.2-4.13 6.69-9.02 6.69-5.46 0-9.94-4.38-9.94-9.8C15 19.58 19.48 15.2 24.94 15.2c2.97 0 5.61 1.09 7.66 2.8l6.61-6.61C34.51 6.11 29.38 4 24 4 14.62 4 6.51 9.38 2.56 17.22l7.98 6.19C13.51 16.33 18.49 13.5 24 13.5z"></path>
        <path fill="#FBBC05" d="M10.53 28.5c-.79-2.01-1.25-4.17-1.25-6.48s.46-4.47 1.25-6.48L2.56 9.22C1.59 11.19 1 13.52 1 16s.59 4.81 1.56 6.78l7.97 6.22z"></path>
        <path fill="#34A853" d="M24 47.5c6.48 0 11.93-2.13 15.96-5.77l-6.61-6.61C29.61 40.54 27.05 41.5 24 41.5c-5.46 0-9.94-4.38-9.94-9.8H4L12.56 38.78C16.51 44.62 24 47.5 24 47.5z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
      </g>
    </svg>
  );

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.appTitle}>EAR Rubrics</h1>
        <button 
          onClick={handleGoogleLogin} 
          className={styles.googleSignInButton}
          disabled={loading || !isAuthReady} 
        >
          <span className={styles.googleIcon}>
            <GoogleIcon />
          </span>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </div>
  );
}
