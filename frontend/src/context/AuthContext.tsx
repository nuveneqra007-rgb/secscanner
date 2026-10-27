import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth'
import type { User, RegisterRequest } from '../types'

interface AuthContextType {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)

  // Hidratar el perfil del usuario al cargar si hay token
  useEffect(() => {
    if (token && !user) {
      getMe()
        .then(setUser)
        .catch(() => {
          // Token inválido o expirado → limpiar
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
    }
  }, [token])

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password)
    localStorage.setItem('token', res.access_token)
    setToken(res.access_token)
    const me = await getMe()
    setUser(me)
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    // Registrar y luego loguear automáticamente
    await apiRegister(data)
    const res = await apiLogin(data.username, data.password)
    localStorage.setItem('token', res.access_token)
    setToken(res.access_token)
    const me = await getMe()
    setUser(me)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isGuest: !token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
