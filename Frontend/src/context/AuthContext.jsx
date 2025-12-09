import { createContext, useContext, useState, useEffect } from 'react'
import { usersAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          if (!parsedUser.role) {
            parsedUser.role = 'customer'
          }
          setUser(parsedUser)
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('user')
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }

    loadUser()
    setLoading(false)

    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (e.newValue === null) {
          setUser(null)
        } else {
          try {
            const parsedUser = JSON.parse(e.newValue)
            if (!parsedUser.role) {
              parsedUser.role = 'customer'
            }
            setUser(parsedUser)
          } catch (error) {
            console.error('Error parsing saved user:', error)
            setUser(null)
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    const handleCustomStorageChange = () => {
      loadUser()
    }
    window.addEventListener('localStorageChange', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleCustomStorageChange)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const users = await usersAPI.getAll()
      const foundUser = users.find(u => u.email === email)
      
      if (!foundUser) {
        throw new Error('Nieprawidłowy email lub hasło')
      }

      const { password: _, ...userWithoutPassword } = foundUser
      
      const savedUser = localStorage.getItem('user')
      let userRole = userWithoutPassword.role
      
      if (!userRole && savedUser) {
        try {
          const parsedSavedUser = JSON.parse(savedUser)
          if (parsedSavedUser.email === foundUser.email && parsedSavedUser.role) {
            userRole = parsedSavedUser.role
          }
        } catch (e) {
        }
      }
      
      if (!userRole) {
        userRole = 'customer'
      }
      
      const userWithRole = { ...userWithoutPassword, role: userRole }
      
      setUser(userWithRole)
      localStorage.setItem('user', JSON.stringify(userWithRole))
      return { success: true, user: userWithRole }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = error.message
      if (error.message.includes('Nie można połączyć się z serwerem')) {
        errorMessage = 'Nie można połączyć się z serwerem. Sprawdź czy backend jest uruchomiony na porcie 8080.'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Błąd połączenia z serwerem. Sprawdź czy backend działa.'
      }
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    try {
      const { role, ...userDataForBackend } = userData
      const response = await usersAPI.register(userDataForBackend)
      
      if (response === 'User registered' || response.includes('registered')) {
        const loginResult = await login(userData.email, userData.password)
        
        if (loginResult.success && role) {
          const userWithRole = { ...loginResult.user, role }
          setUser(userWithRole)
          localStorage.setItem('user', JSON.stringify(userWithRole))
          return { success: true, user: userWithRole }
        }
        
        return loginResult
      } else {
        return { success: false, error: response || 'Błąd rejestracji' }
      }
    } catch (error) {
      console.error('Register error:', error)
      const errorMessage = error.message || 'Wystąpił błąd podczas rejestracji'
      if (errorMessage.includes('Email already exists') || errorMessage.includes('already exists')) {
        return { success: false, error: 'Email już istnieje' }
      }
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('localStorageChange'))
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isRestaurant: user?.role === 'restaurant' || user?.role === 'manager',
    isCustomer: user?.role === 'customer',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

