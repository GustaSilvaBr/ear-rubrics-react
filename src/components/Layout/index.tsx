// src/components/Layout/index.tsx
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { signOut } from "../../auth";
import { useFirebase } from "../../context/FirebaseContext";
import { DropdownMenu } from "../DropdownMenu";
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

const MoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export function Layout() {
  const navigate = useNavigate();
  const { auth, isAuthReady } = useFirebase();
  const [headerTitle, setHeaderTitle] = useState<string>("");
  
  // States for dynamic header actions
  const [onEditCallback, setOnEditCallback] = useState<(() => void) | null>(null);
  const [onSaveCallback, setOnSaveCallback] = useState<(() => void) | null>(null);
  const [onCancelCallback, setOnCancelCallback] = useState<(() => void) | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const triggerEdit = () => {
    if (onEditCallback) {
      onEditCallback();
      setIsEditing(true);
    }
  };

  const triggerSave = () => {
    if (onSaveCallback) {
      onSaveCallback();
      setIsEditing(false);
    }
  };

  const triggerCancel = () => {
    if (onCancelCallback) {
      onCancelCallback();
      setIsEditing(false);
    }
  };

  return (
    <div className={styles.appContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.navBrand}>
            <AppIcon />
            <span className={styles.brandText}>EAR Rubrics</span>
          </Link>
        </div>

        <div className={styles.navCenter}>
          {headerTitle && <h1 className={styles.headerTitle}>{headerTitle}</h1>}
        </div>

        <div className={styles.navRight}>
          <div className={styles.headerActions}>
            {isEditing && (
              <>
                <button onClick={triggerCancel} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={triggerSave} className={styles.saveButtonHeader}>
                  Save Changes
                </button>
              </>
            )}
            
            {isAuthReady && auth?.currentUser && (
              <DropdownMenu
                trigger={
                  <button className={styles.menuTrigger} aria-label="More options">
                    <MoreIcon />
                  </button>
                }
              >
                {!isEditing && onEditCallback && (
                  <button onClick={triggerEdit}>Edit Rubric</button>
                )}
                <button onClick={() => console.log("Delete Rubric")}>Delete Rubric</button>
                <button onClick={handleSignOut} className={styles.signOutOption}>
                  Sign Out
                </button>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>
      <main className={styles.content}>
        <Outlet 
          context={{ 
            setHeaderTitle, 
            setOnEditCallback, 
            setOnSaveCallback, 
            setOnCancelCallback,
            setIsEditing // Allow pages to force the UI state (e.g., on new rubric)
          }} 
        />
      </main>
    </div>
  );
}