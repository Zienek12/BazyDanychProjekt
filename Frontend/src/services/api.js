const API_BASE_URL = '/api'

const DEFAULT_USE_MOCK_API = false

let mockAPI = null
function shouldUseMockAPI() {
  const stored = localStorage.getItem('useMockAPI')
  if (stored !== null) {
    return stored === 'true'
  }
  return DEFAULT_USE_MOCK_API
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      let errorData
      try {
        const text = await response.text()
        try {
          errorData = JSON.parse(text)
        } catch {
          errorData = text || `HTTP error! status: ${response.status}`
        }
      } catch (e) {
        errorData = `HTTP error! status: ${response.status}`
      }
      
      let errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.message || errorData.error || JSON.stringify(errorData)
      
      // Jeśli komunikat błędu jest pusty lub to tylko status, użyj bardziej opisowego komunikatu
      if (!errorMessage || errorMessage.trim() === '' || errorMessage === `HTTP error! status: ${response.status}`) {
        if (response.status === 500) {
          errorMessage = 'Internal Server Error'
        } else if (response.status === 400) {
          errorMessage = 'Bad Request'
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized'
        } else if (response.status === 403) {
          errorMessage = 'Forbidden'
        } else if (response.status === 404) {
          errorMessage = 'Not Found'
        } else {
          errorMessage = `HTTP error! status: ${response.status}`
        }
      }
      
      const error = new Error(errorMessage)
      error.status = response.status
      error.data = errorData
      throw error
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text()
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('API Error: Nie można połączyć się z backendem. Sprawdź czy backend działa na http://localhost:8080', error)
      const connectionError = new Error('Nie można połączyć się z serwerem. Sprawdź czy backend jest uruchomiony.')
      connectionError.status = error.status
      throw connectionError
    }
    // Obsługa błędów związanych z bazą danych
    if (error.status === 500) {
      console.error('API Error: Błąd serwera (500). Możliwy problem z bazą danych.', error)
      const serverError = new Error(error.message || 'Internal Server Error')
      serverError.status = 500
      serverError.data = error.data
      throw serverError
    }
    if (error.status === 503) {
      console.error('API Error: Serwis niedostępny (503). Możliwy problem z bazą danych.', error)
      const serviceError = new Error('Serwis tymczasowo niedostępny. Sprawdź połączenie z bazą danych.')
      serviceError.status = 503
      serviceError.data = error.data
      throw serviceError
    }
    console.error('API Error:', error)
    throw error
  }
}

async function callAPI(realAPIFn, mockAPIFn) {
  if (shouldUseMockAPI()) {
    if (!mockAPI) {
      const module = await import('./mockApi.js')
      mockAPI = module.default
    }
    return await mockAPIFn()
  } else {
    return await realAPIFn()
  }
}

export const usersAPI = {
  register: async (userData) => {
    return callAPI(
      async () => {
        // Normalizuj email: usuń białe znaki i zamień na małe litery
        // Backend porównuje emaile case-sensitive, więc musimy upewnić się, że zawsze używamy małych liter
        const normalizedEmail = userData.email.trim().toLowerCase()
        
        console.log('Registering user:', {
          originalEmail: userData.email,
          normalizedEmail: normalizedEmail,
          name: userData.name
        })
        
        const response = await fetchAPI('/users/register', {
          method: 'POST',
          body: JSON.stringify({
            name: userData.name.trim(),
            email: normalizedEmail,
            password: userData.password,
            role: userData.role || 'customer' // Dodaj role, domyślnie 'customer'
          }),
        })
        return response
      },
      async () => {
        const { mockUsersAPI } = await import('./mockApi.js')
        return mockUsersAPI.register(userData)
      }
    )
  },

  login: async (email, password) => {
    return callAPI(
      async () => {
        // Normalizuj email: usuń białe znaki i zamień na małe litery
        const normalizedEmail = email.trim().toLowerCase()
        
        console.log('Attempting login with:', {
          normalizedEmail: normalizedEmail,
          passwordLength: password ? password.length : 0
        })
        
        try {
          const response = await fetchAPI('/users/login', {
            method: 'POST',
            body: JSON.stringify({
              email: normalizedEmail,
              password: password
            }),
          })
          
          console.log('Login response received:', response)
          return response
        } catch (error) {
          console.error('Login API error:', {
            message: error.message,
            status: error.status,
            data: error.data,
            email: normalizedEmail
          })
          
          // Jeśli backend zwraca 500, może to oznaczać, że użytkownik nie istnieje lub hasło nie pasuje
          if (error.status === 500) {
            const loginError = new Error('Nieprawidłowy email lub hasło. Sprawdź czy użytkownik istnieje w bazie danych.')
            loginError.status = 500
            loginError.data = error.data
            throw loginError
          }
          
          throw error
        }
      },
      async () => {
        const { mockUsersAPI } = await import('./mockApi.js')
        return mockUsersAPI.login(email, password)
      }
    )
  },

  getAll: async () => {
    return callAPI(
      () => fetchAPI('/users'),
      async () => {
        const { mockUsersAPI } = await import('./mockApi.js')
        return mockUsersAPI.getAll()
      }
    )
  },

  getById: async (id) => {
    return callAPI(
      () => fetchAPI(`/users/${id}`),
      async () => {
        const { mockUsersAPI } = await import('./mockApi.js')
        return mockUsersAPI.getById(id)
      }
    )
  },

  delete: async (id) => {
    return callAPI(
      () => fetchAPI(`/users/${id}`, {
        method: 'DELETE',
      }),
      async () => {
        const { mockUsersAPI } = await import('./mockApi.js')
        return mockUsersAPI.delete(id)
      }
    )
  },
}

export const restaurantsAPI = {
  create: async (restaurantData) => {
    return callAPI(
      () => fetchAPI('/restaurants', {
        method: 'POST',
        body: JSON.stringify(restaurantData),
      }),
      async () => {
        const { mockRestaurantsAPI } = await import('./mockApi.js')
        return mockRestaurantsAPI.create(restaurantData)
      }
    )
  },

  getAll: async () => {
    return callAPI(
      () => fetchAPI('/restaurants'),
      async () => {
        const { mockRestaurantsAPI } = await import('./mockApi.js')
        return mockRestaurantsAPI.getAll()
      }
    )
  },

  getById: async (id) => {
    return callAPI(
      () => fetchAPI(`/restaurants/${id}`),
      async () => {
        const { mockRestaurantsAPI } = await import('./mockApi.js')
        return mockRestaurantsAPI.getById(id)
      }
    )
  },

  delete: async (id) => {
    return callAPI(
      () => fetchAPI(`/restaurants/${id}`, {
        method: 'DELETE',
      }),
      async () => {
        const { mockRestaurantsAPI } = await import('./mockApi.js')
        return mockRestaurantsAPI.delete(id)
      }
    )
  },
}

export const menuItemsAPI = {
  create: async (menuItemData) => {
    return callAPI(
      async () => {
        const response = await fetchAPI('/menu-items', {
          method: 'POST',
          body: JSON.stringify({
            restaurantId: menuItemData.restaurantId,
            managerId: menuItemData.managerId,
            name: menuItemData.name,
            description: menuItemData.description,
            price: menuItemData.price,
            category: menuItemData.category
          }),
        })
        return response
      },
      async () => {
        const { mockMenuItemsAPI } = await import('./mockApi.js')
        return mockMenuItemsAPI.create(menuItemData)
      }
    )
  },

  getByRestaurant: async (restaurantId) => {
    return callAPI(
      () => fetchAPI(`/menu-items/restaurant/${restaurantId}`),
      async () => {
        const { mockMenuItemsAPI } = await import('./mockApi.js')
        return mockMenuItemsAPI.getByRestaurant(restaurantId)
      }
    )
  },

  getById: async (id) => {
    return callAPI(
      () => fetchAPI(`/menu-items/${id}`),
      async () => {
        const { mockMenuItemsAPI } = await import('./mockApi.js')
        return mockMenuItemsAPI.getById(id)
      }
    )
  },

  delete: async (id) => {
    return callAPI(
      () => fetchAPI(`/menu-items/${id}`, {
        method: 'DELETE',
      }),
      async () => {
        const { mockMenuItemsAPI } = await import('./mockApi.js')
        return mockMenuItemsAPI.delete(id)
      }
    )
  },
}

export const ordersAPI = {
  create: async (orderData) => {
    return callAPI(
      () => fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.create(orderData)
      }
    )
  },

  getAll: async () => {
    return callAPI(
      async () => {
        // Backend nie ma endpointu GET /api/orders dla wszystkich zamówień
        // Zwracamy pustą tablicę z informacją w konsoli
        console.warn('Backend nie posiada endpointu GET /api/orders. Użyj getByUser() lub getByRestaurant().')
        return []
      },
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.getAll()
      }
    )
  },

  getById: async (id) => {
    return callAPI(
      () => fetchAPI(`/orders/${id}`),
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.getById(id)
      }
    )
  },

  getByUser: async (userId) => {
    return callAPI(
      () => fetchAPI(`/orders/user/${userId}`),
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.getByUser(userId)
      }
    )
  },

  getByRestaurant: async (restaurantId) => {
    return callAPI(
      () => fetchAPI(`/orders/restaurant/${restaurantId}`),
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.getByRestaurant(restaurantId)
      }
    )
  },

  delete: async (id) => {
    return callAPI(
      () => fetchAPI(`/orders/${id}`, {
        method: 'DELETE',
      }),
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.delete(id)
      }
    )
  },

  updateItem: async (orderId, itemData) => {
    return callAPI(
      () => {
        return Promise.reject(new Error('Endpoint /orders/{orderId}/item nie jest dostępny w backendzie'))
      },
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.updateItem(orderId, itemData)
      }
    )
  },

  updateStatus: async (orderId, status) => {
    return callAPI(
      () => {
        return fetchAPI(`/orders/${orderId}/status?status=${encodeURIComponent(status)}`, {
          method: 'PUT',
        })
      },
      async () => {
        const { mockOrdersAPI } = await import('./mockApi.js')
        return mockOrdersAPI.updateStatus(orderId, status)
      }
    )
  },
}

export default {
  users: usersAPI,
  restaurants: restaurantsAPI,
  menuItems: menuItemsAPI,
  orders: ordersAPI,
}

export const toggleMockAPI = (useMock) => {
  localStorage.setItem('useMockAPI', useMock ? 'true' : 'false')
  window.location.reload() // Przeładuj stronę, aby zastosować zmiany
}

export const isUsingMockAPI = () => {
  return localStorage.getItem('useMockAPI') === 'true'
}
