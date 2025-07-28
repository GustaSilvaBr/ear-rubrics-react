// src/auth.ts
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { app } from "./context/FirebaseContext"; // Importe a instância do app Firebase se for inicializada globalmente, ou remova se for via contexto

// Domínio permitido para autenticação
const ALLOWED_DOMAIN = "ear.com.br";

// Função para fazer login com o Google
export async function signInWithGoogle(): Promise<User | null> {
  const auth = getAuth(); // Obtenha a instância de Auth do Firebase
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Validação de domínio
    if (user.email && user.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return user; // Retorna o usuário se o domínio for permitido
    } else {
      // Se o domínio não for permitido, deslogue o usuário imediatamente
      await firebaseSignOut(auth);
      throw new Error(`Access denied. Only users from @${ALLOWED_DOMAIN} are allowed.`);
    }
  } catch (error: any) {
    // Trate erros de autenticação
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("Login popup closed by user.");
      throw new Error("Login cancelled.");
    } else if (error.message && error.message.includes('Access denied')) {
      // Erro de domínio não permitido
      throw error;
    }
    console.error("Error signing in with Google:", error);
    throw new Error(`Authentication failed: ${error.message || "Unknown error"}`);
  }
}

// Função para fazer logout
export async function signOut(): Promise<void> {
  const auth = getAuth(); // Obtenha a instância de Auth do Firebase
  try {
    await firebaseSignOut(auth);
    console.log("User signed out successfully.");
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(`Logout failed: ${error.message || "Unknown error"}`);
  }
}

// Nota: A persistência do estado de autenticação é gerenciada automaticamente pelo Firebase Auth.
// Não é necessário usar localStorage.isAuthenticated como antes.
