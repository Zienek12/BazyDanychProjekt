import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { restaurantsAPI, menuItemsAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import MenuItem from '../components/MenuItem'
import './RestaurantDetails.css'

function RestaurantDetails() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie')
  const { addToCart } = useCart()

  useEffect(() => {
    loadRestaurantData()
  }, [id])

  const loadRestaurantData = async () => {
    try {
      setLoading(true)
      const [restaurantData, menuData] = await Promise.all([
        restaurantsAPI.getById(id),
        menuItemsAPI.getByRestaurant(id)
      ])
      
      setRestaurant({
        ...restaurantData,
        category: restaurantData.category || 'Inne',
        rating: restaurantData.rating || 4.0,
        deliveryTime: restaurantData.deliveryTime || '30-45 min',
        image: restaurantData.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        description: restaurantData.description || `Restauracja ${restaurantData.name}`
      })
      
      const menuWithImages = menuData.map(item => ({
        ...item,
        restaurantId: item.restaurant?.id || item.restaurantId || restaurantData.id,
        available: item.available !== false, // Domyślnie true jeśli nie ma pola
        image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
      }))
      setMenuItems(menuWithImages)
    } catch (err) {
      setError('Nie udało się załadować danych restauracji')
      console.error('Error loading restaurant:', err)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Wszystkie', ...new Set(menuItems.map(item => item.category))]

  const filteredMenu = selectedCategory === 'Wszystkie'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory && item.available !== false)

  const handleAddToCart = (item) => {
    const itemWithRestaurant = {
      ...item,
      restaurantId: restaurant.id
    }
    addToCart(itemWithRestaurant)
    alert(`${item.name} dodano do koszyka!`)
  }

  if (loading) {
    return <div className="loading">Ładowanie danych restauracji...</div>
  }

  if (error || !restaurant) {
    return <div className="error">{error || 'Nie znaleziono restauracji'}</div>
  }

  return (
    <div className="restaurant-details">
      <div className="restaurant-header">
        <img src={restaurant.image} alt={restaurant.name} />
        <div className="restaurant-header-info">
          <h1>{restaurant.name}</h1>
          <p className="restaurant-category">{restaurant.category}</p>
          <p className="restaurant-description">{restaurant.description}</p>
          <div className="restaurant-meta">
            <div className="rating">
              <span className="star">⭐</span>
              <span>{restaurant.rating}</span>
            </div>
            <div className="delivery-time">
              <span>⏱️</span>
              <span>{restaurant.deliveryTime}</span>
            </div>
            <div className="address">
              <span>📍</span>
              <span>{restaurant.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="menu-section">
        <h2>Menu</h2>
        
        {categories.length > 1 && (
          <div className="menu-categories">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {filteredMenu.length > 0 ? (
          <div className="menu-items">
            {filteredMenu.map(item => (
              <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Brak dostępnych pozycji w tej kategorii.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RestaurantDetails

