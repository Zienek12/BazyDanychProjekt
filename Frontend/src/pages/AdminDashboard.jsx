import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI, restaurantsAPI } from '../services/api'
import './AdminDashboard.css'

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

  const toggleUserStatus = async (id) => {
    alert('Zmiana statusu użytkownika nie jest jeszcze dostępna przez API')
  }

  const toggleRestaurantStatus = async (id) => {
    alert('Zmiana statusu restauracji nie jest jeszcze dostępna przez API')
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      return
    }

    try {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id))
      
      await usersAPI.delete(id)
      
      await loadData()
    } catch (err) {
      await loadData()
      
      const errorMessage = err.message || 'Nieznany błąd'
      alert(`Nie udało się usunąć użytkownika: ${errorMessage}\n\nMożliwe przyczyny:\n- Użytkownik jest właścicielem restauracji\n- Użytkownik ma aktywne zamówienia\n- Problem z połączeniem z serwerem`)
      console.error('Error deleting user:', err)
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
      <h1>Panel Administratora</h1>
      
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
                                className="btn-toggle-status"
                                onClick={() => toggleUserStatus(userItem.id)}
                              >
                                {(userItem.active !== false) ? 'Zablokuj' : 'Odblokuj'}
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => deleteUser(userItem.id)}
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


