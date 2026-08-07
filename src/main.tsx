import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { SignIn } from './pages/Signin';
import { SignUp } from './pages/SignUp';
import { ProtectedRoute } from './components/routes/ProtectedRoutes';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <SignIn />
  },
  {
    path: '/signup',
    element: <SignUp />
  },
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    )
  },
  {
    path: '/',
    element: <Navigate to="/chat" />
  },
  {
    path: '*',
    element: <NotFound />
  }
])



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
