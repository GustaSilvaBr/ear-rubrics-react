// src/auth.ts
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User, type Auth } from "firebase/auth";
// Removido: import { app } from "./context/FirebaseContext"; // Não importamos mais o app aqui

// Domínio permitido para autenticação
const ALLOWED_DOMAIN = "ear.com.br";

// Função para fazer login com o Google
// Agora aceita a instância 'auth' como parâmetro
export async function signInWithGoogle(auth: Auth): Promise<User | null> {
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
// Agora aceita a instância 'auth' como parâmetro
export async function signOut(auth: Auth): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log("User signed out successfully.");
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(`Logout failed: ${error.message || "Unknown error"}`);
  }
}
