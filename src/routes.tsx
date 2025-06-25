// src/routes.tsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Rubric } from "./pages/Rubric";
import { auth } from "./auth";
import type { JSX } from "react";

function PrivateRoute({ children }: { children: JSX.Element }) {
  return auth.isAuthenticated ? children : <Navigate to="/login" />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
       <Rubric/>
      </PrivateRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/rubric",
    element: (
      <PrivateRoute>
         <Home />
      </PrivateRoute>
    ),
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}