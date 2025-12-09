import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ordersAPI } from '../services/api'
import './Cart.css'

function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const deliveryFee = 5.99
  const total = getTotalPrice()
  const finalTotal = total + deliveryFee

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (cart.length === 0) {
      return
    }

    const ordersByRestaurant = {}
    cart.forEach(item => {
      const restaurantId = item.restaurantId || 1 // Jeśli brak restaurantId, użyj domyślnego
      if (!ordersByRestaurant[restaurantId]) {
        ordersByRestaurant[restaurantId] = {
          menuItemIds: [],
          quantities: [],
          prices: []
        }
      }
      ordersByRestaurant[restaurantId].menuItemIds.push(item.id)
      ordersByRestaurant[restaurantId].quantities.push(item.quantity)
      ordersByRestaurant[restaurantId].prices.push(item.price)
    })

    setLoading(true)
    setError('')

    try {
      const orderPromises = Object.entries(ordersByRestaurant).map(([restaurantId, orderData]) =>
        ordersAPI.create({
          userId: parseInt(user.id),
          restaurantId: parseInt(restaurantId),
          menuItems: orderData.menuItemIds.map(id => parseInt(id)),
          quantities: orderData.quantities.map(q => parseInt(q))
        })
      )

      await Promise.all(orderPromises)
      clearCart()
      alert('Zamówienie złożone pomyślnie!')
      navigate('/order-history')
    } catch (err) {
      setError('Nie udało się złożyć zamówienia. Spróbuj ponownie.')
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Twój koszyk jest pusty</h2>
        <p>Dodaj produkty z menu restauracji</p>
        <Link to="/" className="btn-primary">
          Przejdź do restauracji
        </Link>
      </div>
    )
  }

  return (
    <div className="cart">
      <h1>Koszyk</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="cart-content">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} alt={item.name} />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="cart-item-price">{item.price.toFixed(2)} zł</p>
              </div>
              <div className="cart-item-controls">
                <button 
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  🗑️
                </button>
              </div>
              <div className="cart-item-total">
                {(item.price * item.quantity).toFixed(2)} zł
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Podsumowanie</h2>
          <div className="summary-row">
            <span>Wartość zamówienia:</span>
            <span>{total.toFixed(2)} zł</span>
          </div>
          <div className="summary-row">
            <span>Koszt dostawy:</span>
            <span>{deliveryFee.toFixed(2)} zł</span>
          </div>
          <div className="summary-row total">
            <span>Razem:</span>
            <span>{finalTotal.toFixed(2)} zł</span>
          </div>
          <button 
            className="btn-checkout" 
            onClick={handleCheckout}
            disabled={loading || !user}
          >
            {loading ? 'Składanie zamówienia...' : !user ? 'Zaloguj się, aby złożyć zamówienie' : 'Złóż zamówienie'}
          </button>
          {!user && (
            <Link to="/login" className="btn-secondary" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cart

