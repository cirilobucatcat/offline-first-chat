import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ProtectedRoute } from './components/routes/ProtectedRoutes';
import Chat from './pages/Chats';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { AuthLayout } from './components/auth/AuthLayout';
import { SettingsPage } from './pages/Settings';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt';
import { ThemeProvider } from './context/ThemeContext';
import { ChatPreferencesProvider } from './context/ChatPreferencesContext';
import { AppearanceProvider } from './context/AppearanceContext';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <SignIn /> },
      { path: '/signup', element: <SignUp /> },
    ],
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
    element: <Landing />
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
            <PwaUpdatePrompt />
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </AppearanceProvider>
    </ChatPreferencesProvider>
  </StrictMode>,
);
