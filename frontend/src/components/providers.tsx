'use client'

import { ReactNode } from 'react'
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { AuthProvider } from '@/hooks/useAuth'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AptosWalletAdapterProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AptosWalletAdapterProvider>
  )
}
