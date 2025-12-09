export const mockUsersAPI = {
  register: async (userData) => {
    return Promise.resolve({ id: Date.now(), ...userData })
  },
  getAll: async () => {
    return Promise.resolve([])
  },
  getById: async (id) => {
    return Promise.resolve({ id, name: 'Mock User', email: 'mock@example.com' })
  },
  delete: async (id) => {
    return Promise.resolve()
  }
}

export const mockRestaurantsAPI = {
  create: async (restaurantData) => {
    return Promise.resolve({ id: Date.now(), ...restaurantData })
  },
  getAll: async () => {
    return Promise.resolve([])
  },
  getById: async (id) => {
    return Promise.resolve({ id, name: 'Mock Restaurant', address: 'Mock Address' })
  },
  delete: async (id) => {
    return Promise.resolve()
  }
}

export const mockMenuItemsAPI = {
  create: async (menuItemData) => {
    return Promise.resolve({ id: Date.now(), ...menuItemData })
  },
  getByRestaurant: async (restaurantId) => {
    return Promise.resolve([])
  },
  getById: async (id) => {
    return Promise.resolve({ id, name: 'Mock Item', price: 0 })
  },
  delete: async (id) => {
    return Promise.resolve()
  }
}

export const mockOrdersAPI = {
  create: async (orderData) => {
    return Promise.resolve({ id: Date.now(), ...orderData })
  },
  getAll: async () => {
    return Promise.resolve([])
  },
  getById: async (id) => {
    return Promise.resolve({ id, status: 'pending' })
  },
  getByUser: async (userId) => {
    return Promise.resolve([])
  },
  getByRestaurant: async (restaurantId) => {
    return Promise.resolve([])
  },
  delete: async (id) => {
    return Promise.resolve()
  },
  updateItem: async (orderId, itemData) => {
    return Promise.resolve({ id: orderId, ...itemData })
  },
  updateStatus: async (orderId, status) => {
    return Promise.resolve({ id: orderId, status })
  }
}

export default {
  users: mockUsersAPI,
  restaurants: mockRestaurantsAPI,
  menuItems: mockMenuItemsAPI,
  orders: mockOrdersAPI
}

