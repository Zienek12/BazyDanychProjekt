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
      // Normalizuj email: usuń białe znaki i zamień na małe litery
      const normalizedEmail = email.trim().toLowerCase()
      
      console.log('AuthContext login called with:', {
        originalEmail: email,
        normalizedEmail: normalizedEmail
      })
      
      // Użyj endpointu /api/users/login z backendu
      const foundUser = await usersAPI.login(normalizedEmail, password)
      
      console.log('Login result from API:', foundUser)
      
      if (!foundUser) {
        console.warn('Login returned null/undefined user')
        throw new Error('Nieprawidłowy email lub hasło')
      }

      // Sprawdź czy foundUser jest obiektem (może być stringiem w przypadku błędu)
      if (typeof foundUser === 'string') {
        console.error('Login returned string instead of user object:', foundUser)
        throw new Error(foundUser || 'Błąd logowania')
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
      
      // Zapisz token jeśli backend go zwraca
      if (foundUser.token) {
        localStorage.setItem('token', foundUser.token)
      }
      
      setUser(userWithRole)
      localStorage.setItem('user', JSON.stringify(userWithRole))
      return { success: true, user: userWithRole }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = error.message
      
      // Obsługa różnych typów błędów
      if (error.message.includes('Nie można połączyć się z serwerem')) {
        errorMessage = 'Nie można połączyć się z serwerem. Sprawdź czy backend jest uruchomiony na porcie 8080.'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Błąd połączenia z serwerem. Sprawdź czy backend działa.'
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = 'Nieprawidłowy email lub hasło'
      } else if (error.status === 500) {
        // Błąd 500 może oznaczać, że użytkownik nie istnieje lub hasło nie pasuje
        // Backend login używa getSingleResult() które rzuca wyjątek jeśli nie znajdzie użytkownika
        errorMessage = 'Nieprawidłowy email lub hasło. Sprawdź czy konto istnieje i czy hasło jest poprawne.'
      } else if (error.message.includes('Internal Server Error')) {
        errorMessage = 'Błąd serwera podczas logowania. Spróbuj ponownie za chwilę.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    // Normalizuj email przed rejestracją (przed try, aby był dostępny w catch)
    const normalizedEmail = userData.email ? userData.email.trim().toLowerCase() : ''
    
    try {
      const { role, ...userDataForBackend } = userData
      
      const normalizedUserData = {
        ...userDataForBackend,
        email: normalizedEmail,
        role: role || 'customer' // Dodaj role z powrotem, domyślnie 'customer'
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
        // Poczekaj chwilę, aby upewnić się, że użytkownik został zapisany w bazie
        await new Promise(resolve => setTimeout(resolve, 200))
        
        console.log('Attempting login after registration with:', {
          email: normalizedEmail,
          passwordLength: userData.password ? userData.password.length : 0
        })
        
        // Użyj znormalizowanego emaila do logowania
        // Jeśli logowanie się nie powiedzie (błąd 500), nie blokuj rejestracji
        // Zamiast tego zwróć sukces i pozwól użytkownikowi zalogować się ręcznie
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
          // Jeśli logowanie się nie powiedzie (np. błąd 500 z backendu),
          // zwróć sukces rejestracji - użytkownik może zalogować się ręcznie
          // Nie tworzymy użytkownika lokalnie, bo to może powodować problemy
        }
        
        // Jeśli dotarliśmy tutaj, rejestracja się powiodła, ale logowanie nie
        // Zwróć sukces rejestracji - użytkownik będzie musiał zalogować się ręcznie
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
      
      // Sprawdź różne warianty komunikatu o istniejącym emailu
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

