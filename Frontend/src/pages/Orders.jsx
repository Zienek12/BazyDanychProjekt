import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { ordersAPI, usersAPI, menuItemsAPI, restaurantsAPI } from '../services/api'
import './Orders.css'

const statusOptions = ['pending', 'in_progress', 'ready', 'delivered', 'cancelled']

function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')
      
      const restaurants = await restaurantsAPI.getAll()
      const userRestaurants = restaurants.filter(r => r.manager?.id === user.id || r.managerId === user.id)
      
      if (userRestaurants.length === 0) {
        setOrders([])
        setError('Nie masz przypisanych restauracji')
        return
      }

      // Pobierz zamówienia dla wszystkich restauracji użytkownika
      const allOrders = []
      for (const restaurant of userRestaurants) {
        try {
          const restaurantOrders = await ordersAPI.getByRestaurant(restaurant.id)
          // Dodaj informacje o restauracji i kliencie do każdego zamówienia
          const ordersWithDetails = await Promise.all(
            restaurantOrders.map(async (order) => {
              // Pobierz dane użytkownika (klienta)
              let customerName = `Użytkownik #${order.user?.id || '?'}`
              try {
                if (order.user?.id) {
                  const customer = await usersAPI.getById(order.user.id)
                  customerName = customer.name || customer.email || customerName
                }
              } catch (err) {
                console.warn('Could not fetch customer data:', err)
              }

              return {
                ...order,
                restaurantName: restaurant.name,
                customerName: customerName,
                items: [] // Backend nie zwraca items w Order modelu
              }
            })
          )
          allOrders.push(...ordersWithDetails)
        } catch (err) {
          console.error(`Error loading orders for restaurant ${restaurant.id}:`, err)
        }
      }

      // Sortuj zamówienia po dacie (najnowsze pierwsze)
      allOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0)
        const dateB = new Date(b.createdAt || 0)
        return dateB - dateA
      })

      setOrders(allOrders)
      
      if (allOrders.length === 0) {
        setError('')
      }
    } catch (err) {
      setError('Nie udało się załadować zamówień')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus)
      // Zaktualizuj status w lokalnym stanie
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (err) {
      alert(`Nie udało się zaktualizować statusu zamówienia: ${err.message || 'Nieznany błąd'}`)
      console.error('Error updating order status:', err)
      // Odśwież zamówienia, aby przywrócić poprzedni status
      await loadOrders()
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak daty'
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Oczekujące',
      'in_progress': 'W przygotowaniu',
      'ready': 'Gotowe do odbioru',
      'delivered': 'Dostarczone',
      'cancelled': 'Anulowane'
    }
    return labels[status] || status
  }

  return (
    <div className="orders-page">
      <h1>Zamówienia</h1>
      
      {loading ? (
        <div className="loading">Ładowanie zamówień...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <p>Brak zamówień.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Zamówienie #{order.id}</h3>
                  <p className="order-customer">Klient: {order.customerName}</p>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                </div>
                <div className="order-status-section">
                  <select
                    value={order.status || 'pending'}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="status-select"
                    style={{
                      backgroundColor: getStatusColor(order.status, 0.1),
                      color: getStatusColor(order.status, 1),
                      borderColor: getStatusColor(order.status, 1)
                    }}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="order-details">
                <div className="order-items">
                  <h4>Informacje o zamówieniu:</h4>
                  <p><strong>Restauracja:</strong> {order.restaurantName || order.restaurant?.name || 'Nieznana'}</p>
                  <p><strong>Klient:</strong> {order.customerName}</p>
                  {order.items && order.items.length > 0 ? (
                    <div>
                      <h5>Produkty:</h5>
                      <ul>
                        {order.items.map((item, index) => (
                          <li key={index}>
                            {item.quantity}x {item.name || `Produkt #${item.menuItemId}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>
                      Szczegóły pozycji zamówienia nie są dostępne w tym widoku.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="order-footer">
                <div className="order-total">
                  <strong>Razem: {order.totalPrice?.toFixed(2) || '0.00'} zł</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getStatusColor(status, opacity = 1) {
  const colors = {
    'pending': `rgba(102, 126, 234, ${opacity})`,
    'in_progress': `rgba(237, 137, 54, ${opacity})`,
    'ready': `rgba(72, 187, 120, ${opacity})`,
    'delivered': `rgba(72, 187, 120, ${opacity})`,
    'cancelled': `rgba(245, 101, 101, ${opacity})`
  }
  return colors[status] || `rgba(113, 128, 150, ${opacity})`
}

export default Orders
