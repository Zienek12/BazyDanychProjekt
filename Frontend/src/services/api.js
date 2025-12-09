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
      
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.message || errorData.error || JSON.stringify(errorData)
      
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
      throw new Error('Nie można połączyć się z serwerem. Sprawdź czy backend jest uruchomiony.')
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
        const response = await fetchAPI('/users/register', {
          method: 'POST',
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            password: userData.password
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
      () => {
        return Promise.resolve([])
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
      () => {
        return Promise.resolve([])
      },
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
