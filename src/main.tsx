import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { ProtectedRoute } from './components/routes/ProtectedRoutes';
import Chat from './pages/Chats';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Auth />
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
