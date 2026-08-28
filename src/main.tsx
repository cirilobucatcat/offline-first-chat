import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { ProtectedRoute } from './components/routes/ProtectedRoutes';
import Chat from './pages/Chats';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import { SettingsPage } from './pages/Settings';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt';
import { ThemeProvider } from './context/ThemeContext';
import { ChatPreferencesProvider } from './context/ChatPreferencesContext';
import { AppearanceProvider } from './context/AppearanceContext';

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
    path: '/settings', element: (
      <ProtectedRoute>
        <SettingsPage />
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
    <ChatPreferencesProvider>
      <AppearanceProvider>
        <ThemeProvider>
          <AuthProvider>
            <NetworkStatusBanner />
            <PwaUpdatePrompt />
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </AppearanceProvider>
    </ChatPreferencesProvider>
  </StrictMode>,
);
