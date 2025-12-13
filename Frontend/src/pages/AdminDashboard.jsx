import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI, restaurantsAPI, ordersAPI } from '../services/api'
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

  const deactivateUser = async (id) => {
    const userToDeactivate = users.find(u => u.id === id)
    const isCurrentlyActive = userToDeactivate?.active !== false
    
    if (!window.confirm(
      `Czy na pewno chcesz ${isCurrentlyActive ? 'dezaktywować' : 'aktywować'} konto użytkownika ${userToDeactivate?.name || `#${id}`}?`
    )) {
      return
    }

    // Dezaktywacja jest realizowana przez ustawienie pola active na false
    // Ponieważ backend nie ma endpointu do zmiany statusu, używamy usuwania z możliwością przywrócenia
    // W rzeczywistości powinniśmy mieć endpoint PUT /api/users/{id}/deactivate
    alert('Dezaktywacja konta nie jest jeszcze dostępna przez API. Użyj opcji "Usuń" aby usunąć użytkownika.')
  }

  const toggleRestaurantStatus = async (id) => {
    alert('Zmiana statusu restauracji nie jest jeszcze dostępna przez API')
  }

  /**
   * Czyści cały localStorage przeglądarki
   * 
   * Usuwa wszystkie dane zapisane lokalnie:
   * - user (dane zalogowanego użytkownika)
   * - cart (koszyk)
   * - token (token autoryzacji)
   * - useMockAPI (ustawienia Mock API)
   * - wszystkie inne klucze
   * 
   * Alternatywnie można wyczyścić localStorage przez konsolę:
   * localStorage.clear(); window.location.reload();
   * 
   * Więcej informacji: zobacz Frontend/LOCALSTORAGE_INFO.md
   */
  const clearAllLocalStorage = () => {
    if (!window.confirm(
      'Czy na pewno chcesz wyczyścić CAŁY localStorage?\n\n' +
      'To usunie:\n' +
      '- Wszystkich użytkowników (dane logowania)\n' +
      '- Koszyk\n' +
      '- Token autoryzacji\n' +
      '- Ustawienia Mock API\n' +
      '- Wszystkie inne dane zapisane lokalnie\n\n' +
      'Po wyczyszczeniu zostaniesz wylogowany i strona zostanie przeładowana.'
    )) {
      return
    }

    // Wyczyść wszystkie klucze localStorage
    localStorage.clear()
    
    // Przeładuj stronę, aby zastosować zmiany
    window.location.reload()
  }

  const deleteUser = async (id) => {
    const userToDelete = users.find(u => u.id === id)
    if (!window.confirm(`Czy na pewno chcesz dezaktywować konto użytkownika ${userToDelete?.name || `#${id}`}?\n\nTo spowoduje usunięcie użytkownika z systemu.`)) {
      return
    }

    try {
      // Sprawdź czy użytkownik ma zamówienia
      let userOrders = []
      try {
        userOrders = await ordersAPI.getByUser(id)
      } catch (ordersErr) {
        console.warn('Could not fetch user orders:', ordersErr)
        // Kontynuuj nawet jeśli nie udało się pobrać zamówień
      }

      // Sprawdź czy użytkownik jest właścicielem restauracji
      const userRestaurants = restaurants.filter(
        r => r.manager?.id === id || r.managerId === id
      )

      // Jeśli użytkownik ma zamówienia, zapytaj czy je usunąć
      if (userOrders.length > 0) {
        const confirmDeleteOrders = window.confirm(
          `Ten użytkownik ma ${userOrders.length} zamówień. ` +
          `Czy chcesz usunąć również te zamówienia?`
        )
        
        if (confirmDeleteOrders) {
          // Usuń wszystkie zamówienia użytkownika
          for (const order of userOrders) {
            try {
              await ordersAPI.delete(order.id)
            } catch (orderErr) {
              console.error(`Error deleting order ${order.id}:`, orderErr)
              // Kontynuuj usuwanie innych zamówień nawet jeśli jedno się nie powiodło
            }
          }
        } else {
          // Użytkownik anulował - nie można usunąć użytkownika z zamówieniami
          alert('Nie można usunąć użytkownika, który ma zamówienia. Najpierw usuń zamówienia.')
          return
        }
      }

      // Jeśli użytkownik jest właścicielem restauracji, najpierw usuń restauracje
      if (userRestaurants.length > 0) {
        const confirmDeleteRestaurants = window.confirm(
          `Ten użytkownik jest właścicielem ${userRestaurants.length} restauracji. ` +
          `Czy chcesz usunąć również te restauracje?`
        )
        
        if (confirmDeleteRestaurants) {
          // Usuń wszystkie restauracje użytkownika
          for (const restaurant of userRestaurants) {
            try {
              await restaurantsAPI.delete(restaurant.id)
            } catch (restaurantErr) {
              console.error(`Error deleting restaurant ${restaurant.id}:`, restaurantErr)
              // Kontynuuj usuwanie innych restauracji nawet jeśli jedna się nie powiodła
            }
          }
        } else {
          // Użytkownik anulował - nie można usunąć użytkownika z restauracjami
          alert('Nie można usunąć użytkownika, który jest właścicielem restauracji. Najpierw usuń restauracje.')
          return
        }
      }

      // Spróbuj usunąć użytkownika z backendu
      let deletionSuccessful = false
      let lastError = null
      
      try {
        await usersAPI.delete(id)
        deletionSuccessful = true
      } catch (deleteErr) {
        lastError = deleteErr
        console.error('First deletion attempt failed:', deleteErr)
        
        // Jeśli usunięcie się nie powiodło, ale już usunęliśmy powiązania,
        // spróbuj ponownie po krótkim opóźnieniu
        if (userRestaurants.length > 0 || userOrders.length > 0) {
          console.log('Retrying user deletion after cleaning up related data...')
          await new Promise(resolve => setTimeout(resolve, 500)) // Krótkie opóźnienie
          
          try {
            await usersAPI.delete(id)
            deletionSuccessful = true
          } catch (retryErr) {
            console.error('Retry deletion failed:', retryErr)
            lastError = retryErr
          }
        }
      }
      
      // Jeśli wszystkie powiązania zostały usunięte, ale backend nadal zwraca błąd,
      // zapytaj użytkownika czy zaakceptować usunięcie mimo błędu
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
        // Usuń użytkownika z UI
        setUsers(prevUsers => prevUsers.filter(user => user.id !== id))
        // Odśwież dane
        await loadData()
      } else {
        // Jeśli usunięcie się nie powiodło, przywróć dane
        await loadData()
        
        // Wyświetl szczegółowy komunikat błędu
        const errorMessage = lastError?.message || 'Nieznany błąd'
        const errorData = lastError?.data || ''
        
        // Spróbuj sparsować szczegóły błędu z JSON
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
        
        // Jeśli wszystkie znane powiązania zostały usunięte, zapytaj czy zaakceptować mimo błędu
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
      // Przywróć użytkownika w UI jeśli usunięcie się nie powiodło
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Panel Administratora</h1>
        <button
          onClick={clearAllLocalStorage}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          title="Wyczyść cały localStorage (użytkownicy, koszyk, token, ustawienia)"
        >
          🗑️ Wyczyść localStorage
        </button>
      </div>
      
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
                                title="Dezaktywuje konto użytkownika (usuwa z systemu)"
                              >
                                Dezaktywuj
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


