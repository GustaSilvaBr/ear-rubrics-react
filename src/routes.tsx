// src/routes.tsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Rubric } from "./pages/Rubric";
import { Admin } from "./pages/Admin";
import { RubricFeedback } from "./pages/RubricFeedback"; // Importe o novo componente
import { Layout } from "./components/Layout";
import { useFirebase } from "./context/FirebaseContext";
import React, { useState, useEffect } from "react";
import { doc, getDoc, collection } from "firebase/firestore";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { auth, isAuthReady } = useFirebase();

  if (!isAuthReady) {
    return <div>Carregando autenticação...</div>;
  }

  if (!auth?.currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { db, userId, teacherEmail, isAuthReady } = useFirebase();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);

  useEffect(() => {
    if (isAuthReady && db && userId && teacherEmail) {
      const checkAdminStatus = async () => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const adminDocRef = doc(collection(db, `artifacts/${appId}/admins`), teacherEmail);

        try {
          const docSnap = await getDoc(adminDocRef);
          if (docSnap.exists()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Erro ao verificar status de admin:", error);
          setIsAdmin(false);
        } finally {
          setLoadingAdminCheck(false);
        }
      };
      checkAdminStatus();
    } else if (isAuthReady && (!db || !userId || !teacherEmail)) {
      setIsAdmin(false);
      setLoadingAdminCheck(false);
    }
  }, [db, userId, teacherEmail, isAuthReady]);

  if (loadingAdminCheck) {
    return <div>Verificando permissões de admin...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
}


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // Rota de feedback da rubrica (sem autenticação)
    path: "/rubricFeedback",
    element: <RubricFeedback />,
  },
  {
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/rubric",
        element: <Rubric />,
      },
      {
        path: "/admin",
        element: (
          <AdminRoute>
            <Admin />
          </AdminRoute>
        ),
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
