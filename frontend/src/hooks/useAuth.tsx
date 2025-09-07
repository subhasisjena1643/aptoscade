"use client"

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react'
import { apiClient, handleAPIError, type User, type AuthResponse } from '@/lib/api-client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, walletAddress?: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  // Check for existing token and validate user on app start
  const initializeAuth = useCallback(async () => {
    try {
      // Check if there's a token in storage
      const token = localStorage.getItem('aptoscade_token')
      if (token) {
        // Validate token by fetching user profile
        const user = await apiClient.getProfile()
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    } catch (error) {
      // Token is invalid or expired, clear it
      apiClient.clearToken()
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }, [])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const login = async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const authResponse: AuthResponse = await apiClient.login(email, password)
      
      setAuthState({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw new Error(handleAPIError(error))
    }
  }

  const register = async (
    username: string, 
    email: string, 
    password: string, 
    walletAddress?: string
  ): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const authResponse: AuthResponse = await apiClient.register(
        username, 
        email, 
        password, 
        walletAddress
      )
      
      setAuthState({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw new Error(handleAPIError(error))
    }
  }

  const logout = (): void => {
    apiClient.clearToken()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!authState.user) throw new Error('No user logged in')
    
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const updatedUser = await apiClient.updateProfile(updates)
      
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw new Error(handleAPIError(error))
    }
  }

  const refreshProfile = async (): Promise<void> => {
    if (!authState.isAuthenticated) return
    
    try {
      const user = await apiClient.getProfile()
      setAuthState(prev => ({
        ...prev,
        user
      }))
    } catch (error) {
      // If refresh fails, user might be logged out
      console.error('Failed to refresh profile:', error)
      logout()
    }
  }

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
