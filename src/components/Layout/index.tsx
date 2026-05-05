// src/components/Layout/index.tsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { doc, collection, getDoc } from "firebase/firestore";
import { signOut } from "../../auth";
import { useFirebase } from "../../context/FirebaseContext";
import styles from "./Layout.module.scss";

// A simple book icon for the application brand
const AppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export function Layout() {
  const navigate = useNavigate();
  const { db, auth, userId, teacherEmail, isAuthReady } = useFirebase();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !db || !userId || !teacherEmail) return;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    getDoc(doc(collection(db, `artifacts/${appId}/admins`), teacherEmail)).then((snap) => {
      setIsAdmin(snap.exists());
    });
  }, [db, userId, teacherEmail, isAuthReady]);

  const handleSignOut = async () => {
    if (!auth) { // Garante que a instância auth está disponível
      console.error("Firebase Auth not initialized.");
      return;
    }
    try {
      await signOut(auth); // <--- AQUI: Passa a instância 'auth'
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
      // Você pode adicionar um tratamento de erro na UI aqui, se necessário
    }
  };

  return (
    <div className={styles.appContainer}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navBrand}>
          <AppIcon />
          <span>EAR Rubrics</span>
        </Link>
        {isAuthReady && auth?.currentUser && (
          <div className={styles.navActions}>
            {isAdmin && (
              <Link to="/admin" className={styles.adminLink}>
                Admin
              </Link>
            )}
            <button onClick={handleSignOut} className={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        )}
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
