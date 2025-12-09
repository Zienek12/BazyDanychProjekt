import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { ordersAPI, restaurantsAPI, menuItemsAPI } from '../services/api'
import './OrderHistory.css'

function OrderHistory() {
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
      const ordersData = await ordersAPI.getByUser(user.id)
      
      const ordersWithDetails = ordersData.map((order) => {
        const restaurantId = order.restaurant?.id || order.restaurantId
        const restaurantName = order.restaurant?.name || `Restauracja #${restaurantId}`
        
        return {
          ...order,
          restaurantId: restaurantId,
          restaurantName: restaurantName,
          items: order.items || []
        }
      })
      
      setOrders(ordersWithDetails)
    } catch (err) {
      setError('Nie udało się załadować historii zamówień')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'dostarczone':
        return '#48bb78'
      case 'in_progress':
      case 'w trakcie':
      case 'w przygotowaniu':
        return '#ed8936'
      case 'cancelled':
      case 'anulowane':
        return '#f56565'
      case 'pending':
      case 'oczekujące':
        return '#667eea'
      default:
        return '#718096'
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

  if (!user) {
    return (
      <div className="order-history">
        <h1>Moja Historia Zamówień</h1>
        <div className="no-orders">
          <p>Musisz być zalogowany, aby zobaczyć historię zamówień.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="order-history">
      <h1>Moja Historia Zamówień</h1>
      
      {loading ? (
        <div className="loading">Ładowanie zamówień...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <p>Nie masz jeszcze żadnych zamówień.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>{order.restaurantName}</h3>
                  <p className="order-date">Data: {formatDate(order.createdAt)}</p>
                </div>
                <span 
                  className="order-status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {order.status || 'Oczekujące'}
                </span>
              </div>
              
              <div className="order-items">
                <h4>Zamówione produkty:</h4>
                {order.items && order.items.length > 0 ? (
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name || `Produkt #${item.menuItemId}`} - {item.price?.toFixed(2) || '0.00'} zł
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Szczegóły pozycji nie są dostępne</p>
                )}
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

export default OrderHistory

