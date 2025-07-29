// src/routes.tsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Rubric } from "./pages/Rubric";
import { Layout } from "./components/Layout";
import { useFirebase } from "./context/FirebaseContext"; // Importe o hook useFirebase
import type { JSX } from "react";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { auth, isAuthReady } = useFirebase(); // Obtenha auth e isAuthReady do contexto

  // Se o Firebase ainda não estiver pronto, não renderize nada ou um loader
  if (!isAuthReady) {
    return <div>Loading authentication...</div>; // Ou um spinner/loader mais sofisticado
  }

  // Redirecione para o login se não houver um usuário autenticado
  if (!auth?.currentUser) {
    return <Navigate to="/login" />;
  }

  // Renderize os filhos se o usuário estiver autenticado
  return children;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // Todas as rotas protegidas são filhas do componente Layout
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
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
