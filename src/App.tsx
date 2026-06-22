import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/workorders",
    element: <Dashboard />,
  },
  {
    path: "/lampposts",
    element: <Dashboard />,
  },
  {
    path: "/map",
    element: <Dashboard />,
  },
  {
    path: "/statistics",
    element: <Dashboard />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
