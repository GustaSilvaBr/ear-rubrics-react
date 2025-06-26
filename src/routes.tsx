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
import { Layout } from "./components/Layout"; // Import the new Layout

function PrivateRoute({ children }: { children: JSX.Element }) {
  return auth.isAuthenticated ? children : <Navigate to="/login" />;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // All protected routes are now children of the Layout component
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