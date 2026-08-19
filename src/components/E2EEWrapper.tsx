import { type ReactNode } from 'react'
import { IdentityKeyGate } from './crypto/IdentityKeyGate'
import { ProtectedRoute } from './routes/ProtectedRoutes'

export default function E2EEWrapper({ children }: { children: ReactNode}) {
  return (
    <IdentityKeyGate>
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    </IdentityKeyGate>
  )
}
