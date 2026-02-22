// src/components/Layout/index.tsx
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { signOut } from "../../auth";
import { useFirebase } from "../../context/FirebaseContext";
import styles from "./Layout.module.scss";

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
  const { auth, isAuthReady } = useFirebase();
  const [headerTitle, setHeaderTitle] = useState<string>("");

  const handleSignOut = async () => {
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      return;
    }
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <div className={styles.appContainer}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navBrand}>
          <AppIcon />
          <span>EAR Rubrics{headerTitle ? ` - ${headerTitle}` : ""}</span>
        </Link>
        {isAuthReady && auth?.currentUser && (
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        )}
      </nav>
      <main className={styles.content}>
        <Outlet context={{ setHeaderTitle }} />
      </main>
    </div>
  );
}