import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI, restaurantsAPI, ordersAPI, menuItemsAPI } from '../services/api'
import './AdminDashboard.css'

// Admin dashboard
function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'users') {
        const usersData = await usersAPI.getAll()
        setUsers(usersData)
      } else {
        const restaurantsData = await restaurantsAPI.getAll()
        const restaurantsWithOwners = restaurantsData.map((restaurant) => {
          const managerId = restaurant.manager?.id || restaurant.managerId
          const managerName = restaurant.manager?.name || `Użytkownik #${managerId}`
          
          return {
            ...restaurant,
            owner: managerName,
            status: restaurant.status || 'active'
          }
        })
        setRestaurants(restaurantsWithOwners)
      }
    } catch (err) {
      setError('Nie udało się załadować danych')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }


  const toggleRestaurantStatus = async (id) => {
    alert('Zmiana statusu restauracji nie jest jeszcze dostępna przez API')
  }

  const deleteUser = async (id) => {
    const userToDelete = users.find(u => u.id === id)
    if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika ${userToDelete?.name || `#${id}`}?\n\nTo spowoduje trwałe usunięcie użytkownika z systemu.`)) {
      return
    }

    try {
      let userOrders = []
      try {
        userOrders = await ordersAPI.getByUser(id)
      } catch (ordersErr) {
        console.warn('Could not fetch user orders:', ordersErr)
      }

      const userRestaurants = restaurants.filter(
        r => r.manager?.id === id || r.managerId === id
      )

      if (userOrders.length > 0) {
        const confirmDeleteOrders = window.confirm(
          `Ten użytkownik ma ${userOrders.length} zamówień. ` +
          `Czy chcesz usunąć również te zamówienia?`
        )
        
        if (confirmDeleteOrders) {
          for (const order of userOrders) {
            try {
              await ordersAPI.delete(order.id)
            } catch (orderErr) {
              console.error(`Error deleting order ${order.id}:`, orderErr)
            }
          }
        } else {
          alert('Nie można usunąć użytkownika, który ma zamówienia. Najpierw usuń zamówienia.')
          return
        }
      }

      if (userRestaurants.length > 0) {
        const confirmDeleteRestaurants = window.confirm(
          `Ten użytkownik jest właścicielem ${userRestaurants.length} restauracji. ` +
          `Czy chcesz usunąć również te restauracje?`
        )
        
        if (confirmDeleteRestaurants) {
          for (const restaurant of userRestaurants) {
            try {
              // First, delete all orders for this restaurant (including from other users)
              try {
                const restaurantOrders = await ordersAPI.getByRestaurant(restaurant.id)
                for (const order of restaurantOrders) {
                  try {
                    await ordersAPI.delete(order.id)
                  } catch (orderErr) {
                    console.error(`Error deleting order ${order.id} for restaurant ${restaurant.id}:`, orderErr)
                  }
                }
              } catch (ordersErr) {
                console.warn(`Could not fetch/delete orders for restaurant ${restaurant.id}:`, ordersErr)
              }
              
              // Then, delete all menu items for this restaurant
              try {
                const menuItems = await menuItemsAPI.getByRestaurant(restaurant.id)
                for (const menuItem of menuItems) {
                  try {
                    await menuItemsAPI.delete(menuItem.id)
                  } catch (menuItemErr) {
                    console.error(`Error deleting menu item ${menuItem.id}:`, menuItemErr)
                  }
                }
              } catch (menuItemsErr) {
                console.warn(`Could not fetch/delete menu items for restaurant ${restaurant.id}:`, menuItemsErr)
              }
              
              // Wait a bit before deleting restaurant
              await new Promise(resolve => setTimeout(resolve, 300))
              
              // Finally delete the restaurant
              await restaurantsAPI.delete(restaurant.id)
            } catch (restaurantErr) {
              console.error(`Error deleting restaurant ${restaurant.id}:`, restaurantErr)
            }
          }
        } else {
          alert('Nie można usunąć użytkownika, który jest właścicielem restauracji. Najpierw usuń restauracje.')
          return
        }
      }

      // Wait a bit to ensure all deletions are processed by the database
      if (userRestaurants.length > 0 || userOrders.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Delete user with multiple retries
      let deletionSuccessful = false
      let lastError = null
      const maxRetries = 3
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await usersAPI.delete(id)
          deletionSuccessful = true
          break
        } catch (deleteErr) {
          lastError = deleteErr
          console.error(`User deletion attempt ${attempt + 1} failed:`, deleteErr)
          
          if (attempt < maxRetries) {
            const waitTime = (attempt + 1) * 1000 // Increasing wait time: 1s, 2s, 3s
            console.log(`Retrying user deletion after ${waitTime}ms...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
      }
      
      if (!deletionSuccessful && (userRestaurants.length > 0 || userOrders.length > 0)) {
        const confirmIgnoreError = window.confirm(
          `Wszystkie powiązane dane (restauracje i zamówienia) zostały usunięte, ` +
          `ale backend zwrócił błąd podczas usuwania użytkownika.\n\n` +
          `Czy chcesz zaakceptować usunięcie użytkownika mimo błędu? ` +
          `(Użytkownik zostanie usunięty z listy, ale może nadal istnieć w bazie danych)`
        )
        
        if (confirmIgnoreError) {
          console.log('User confirmed ignoring backend error, treating deletion as successful')
          deletionSuccessful = true
        }
      }
      
      if (deletionSuccessful) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== id))
        await loadData()
      } else {
        await loadData()
        
        const errorMessage = lastError?.message || 'Nieznany błąd'
        const errorData = lastError?.data || ''
        
        let errorDetailsText = ''
        try {
          if (typeof errorData === 'string') {
            const parsed = JSON.parse(errorData)
            errorDetailsText = parsed.message || parsed.error || errorData
          } else if (errorData && typeof errorData === 'object') {
            errorDetailsText = errorData.message || errorData.error || JSON.stringify(errorData)
          } else {
            errorDetailsText = String(errorData)
          }
        } catch (e) {
          errorDetailsText = typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
        }
        
        console.error('Full error details:', {
          message: errorMessage,
          status: lastError?.status,
          data: errorData,
          parsedDetails: errorDetailsText
        })
        
        const hasRelatedData = userRestaurants.length > 0 || userOrders.length > 0
        const allRelatedDeleted = userRestaurants.length === 0 && userOrders.length === 0
        
        if (allRelatedDeleted || hasRelatedData) {
          const confirmIgnoreError = window.confirm(
            `Nie udało się usunąć użytkownika z backendu.\n\n` +
            `Błąd: ${errorMessage}\n` +
            `Szczegóły: ${errorDetailsText}\n\n` +
            `${hasRelatedData ? 'Wszystkie znane powiązania zostały usunięte. ' : ''}` +
            `Czy chcesz zaakceptować usunięcie użytkownika mimo błędu?\n\n` +
            `(Użytkownik zostanie usunięty z listy, ale może nadal istnieć w bazie danych z powodu innych powiązań)`
          )
          
          if (confirmIgnoreError) {
            console.log('User confirmed ignoring backend error, treating deletion as successful')
            setUsers(prevUsers => prevUsers.filter(user => user.id !== id))
            await loadData()
            return
          }
        }
        
        alert(
          `Nie udało się usunąć użytkownika: ${errorMessage}\n\n` +
          `Szczegóły: ${errorDetailsText}\n\n` +
          `Możliwe przyczyny:\n` +
          `- Problem z bazą danych (foreign key constraints)\n` +
          `- Użytkownik może mieć inne powiązania w bazie danych (np. menu_items, order_items)\n` +
          `- Problem z połączeniem z serwerem`
        )
      }
    } catch (err) {
      await loadData()
      
      const errorMessage = err.message || 'Nieznany błąd'
      console.error('Unexpected error during user deletion:', err)
      alert(`Nieoczekiwany błąd podczas usuwania użytkownika: ${errorMessage}`)
    }
  }

  const deleteRestaurant = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę restaurację?')) {
      return
    }

    try {
      await restaurantsAPI.delete(id)
      await loadData()
    } catch (err) {
      alert('Nie udało się usunąć restauracji')
      console.error('Error deleting restaurant:', err)
    }
  }

  return (
    <div className="admin-dashboard">
      <h1 style={{ marginBottom: '1.5rem' }}>Panel Administratora</h1>
      
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Użytkownicy
        </button>
        <button
          className={`tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restauracje
        </button>
      </div>

      {loading ? (
        <div className="loading">Ładowanie danych...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {activeTab === 'users' && (
            <div className="users-section">
              <h2>Zarządzanie Użytkownikami</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Imię i nazwisko</th>
                      <th>Email</th>
                      <th>Rola</th>
                      <th>Status</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                          Brak użytkowników
                        </td>
                      </tr>
                    ) : (
                      users.map(userItem => (
                        <tr key={userItem.id}>
                          <td>{userItem.id}</td>
                          <td>{userItem.name}</td>
                          <td>{userItem.email}</td>
                          <td>
                            <span className={`role-badge ${userItem.role}`}>
                              {userItem.role === 'customer' ? 'Klient' : userItem.role === 'restaurant' || userItem.role === 'manager' ? 'Restaurator' : 'Admin'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${(userItem.active !== false) ? 'active' : 'blocked'}`}>
                              {(userItem.active !== false) ? 'Aktywny' : 'Zablokowany'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-delete"
                                onClick={() => deleteUser(userItem.id)}
                                title="Usuwa użytkownika z systemu"
                              >
                                Usuń
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'restaurants' && (
            <div className="restaurants-section">
              <h2>Zarządzanie Restauracjami</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nazwa</th>
                      <th>Właściciel</th>
                      <th>Adres</th>
                      <th>Status</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                          Brak restauracji
                        </td>
                      </tr>
                    ) : (
                      restaurants.map(restaurant => (
                        <tr key={restaurant.id}>
                          <td>{restaurant.id}</td>
                          <td>{restaurant.name}</td>
                          <td>{restaurant.owner}</td>
                          <td>{restaurant.address}</td>
                          <td>
                            <span className={`status-badge ${restaurant.status}`}>
                              {restaurant.status === 'active' ? 'Aktywna' : 'Oczekująca'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-toggle-status"
                                onClick={() => toggleRestaurantStatus(restaurant.id)}
                              >
                                {restaurant.status === 'active' ? 'Dezaktywuj' : 'Aktywuj'}
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => deleteRestaurant(restaurant.id)}
                              >
                                Usuń
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard


