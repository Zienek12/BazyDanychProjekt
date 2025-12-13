import { createContext, useContext, useState, useEffect } from 'react'
import { usersAPI } from '../services/api'

const AuthContext = createContext(null)

// Auth context provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on startup
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

    // Listen to localStorage changes
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
      // Normalize email
      const normalizedEmail = email.trim().toLowerCase()
      
      console.log('AuthContext login called with:', {
        originalEmail: email,
        normalizedEmail: normalizedEmail
      })
      
      // Login via API
      const foundUser = await usersAPI.login(normalizedEmail, password)
      
      console.log('Login result from API:', foundUser)
      
      if (!foundUser) {
        console.warn('Login returned null/undefined user')
        throw new Error('Nieprawidłowy email lub hasło')
      }

      // Validate response type
      if (typeof foundUser === 'string') {
        console.error('Login returned string instead of user object:', foundUser)
        throw new Error(foundUser || 'Błąd logowania')
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = foundUser
      
      // Set user role
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
      
      // Save token
      if (foundUser.token) {
        localStorage.setItem('token', foundUser.token)
      }
      
      setUser(userWithRole)
      localStorage.setItem('user', JSON.stringify(userWithRole))
      return { success: true, user: userWithRole }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = error.message
      
      // Error handling
      if (error.message.includes('Nie można połączyć się z serwerem')) {
        errorMessage = 'Nie można połączyć się z serwerem. Sprawdź czy backend jest uruchomiony na porcie 8080.'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Błąd połączenia z serwerem. Sprawdź czy backend działa.'
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = 'Nieprawidłowy email lub hasło'
      } else if (error.status === 500) {
        errorMessage = 'Nieprawidłowy email lub hasło. Sprawdź czy konto istnieje i czy hasło jest poprawne.'
      } else if (error.message.includes('Internal Server Error')) {
        errorMessage = 'Błąd serwera podczas logowania. Spróbuj ponownie za chwilę.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    // Normalize email
    const normalizedEmail = userData.email ? userData.email.trim().toLowerCase() : ''
    
    try {
      const { role, ...userDataForBackend } = userData
      
      const normalizedUserData = {
        ...userDataForBackend,
        email: normalizedEmail,
        role: role || 'customer'
      }
      
      console.log('Registering user:', {
        originalEmail: userData.email,
        normalizedEmail: normalizedEmail,
        name: normalizedUserData.name,
        role: normalizedUserData.role
      })
      
      const response = await usersAPI.register(normalizedUserData)
      
      console.log('Register response:', response)
      
      if (response === 'User registered' || response.includes('registered')) {
        // Short delay for DB write
        await new Promise(resolve => setTimeout(resolve, 200))
        
        console.log('Attempting login after registration with:', {
          email: normalizedEmail,
          passwordLength: userData.password ? userData.password.length : 0
        })
        
        // Try auto-login after registration
        let loginResult
        try {
          loginResult = await login(normalizedEmail, userData.password)
          console.log('Login result after registration:', loginResult)
          
          if (loginResult.success) {
            if (role) {
              const userWithRole = { ...loginResult.user, role }
              setUser(userWithRole)
              localStorage.setItem('user', JSON.stringify(userWithRole))
              return { success: true, user: userWithRole }
            }
            return loginResult
          }
        } catch (loginError) {
          console.error('Login failed after registration (this is OK, user can login manually):', loginError)
        }
        
        // Registration OK, requires manual login
        return { 
          success: true, 
          user: null,
          needsManualLogin: true,
          message: 'Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.'
        }
      } else {
        return { success: false, error: response || 'Błąd rejestracji' }
      }
    } catch (error) {
      console.error('Register error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        originalEmail: userData.email,
        normalizedEmail: normalizedEmail
      })
      
      const errorMessage = error.message || 'Wystąpił błąd podczas rejestracji'
      
      // Check if email already exists
      if (errorMessage.includes('Email already exists') || 
          errorMessage.includes('already exists') ||
          errorMessage.includes('Email już istnieje') ||
          (error.status === 400 && errorMessage.toLowerCase().includes('email'))) {
        return { 
          success: false, 
          error: `Email ${normalizedEmail} jest już zarejestrowany. Spróbuj się zalogować lub użyj innego adresu email.` 
        }
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

