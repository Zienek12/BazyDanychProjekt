import { useState, useEffect } from 'react'
import { restaurantsAPI } from '../services/api'
import SearchBar from '../components/SearchBar'
import RestaurantCard from '../components/RestaurantCard'
import './Home.css'

// Available restaurant categories
const categories = ['Wszystkie', 'Włoska', 'Japońska', 'Amerykańska', 'Turecka', 'Wegetariańska', 'Meksykańska']

// Home page with restaurant list
function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie')

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    try {
      setLoading(true)
      const data = await restaurantsAPI.getAll()
      // Set default values for restaurants
      const restaurantsWithDefaults = data.map(restaurant => ({
        ...restaurant,
        category: restaurant.category || 'Inne',
        rating: restaurant.rating || 4.0,
        deliveryTime: restaurant.deliveryTime || '30-45 min',
        image: restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        description: restaurant.description || `Restauracja ${restaurant.name}`
      }))
      setRestaurants(restaurantsWithDefaults)
    } catch (err) {
      setError('Nie udało się załadować restauracji')
      console.error('Error loading restaurants:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter restaurants by search and category
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (restaurant.description && restaurant.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'Wszystkie' || restaurant.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="home">
      <div className="hero-section">
        <h1>Zamów jedzenie z ulubionych restauracji</h1>
        <p>Wybierz z setek restauracji i ciesz się pysznym jedzeniem w domu</p>
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Szukaj restauracji lub dań..."
        />
      </div>

      <div className="categories-section">
        <h2>Kategorie</h2>
        <div className="categories-list">
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
      </div>

      <div className="restaurants-section">
        <h2>Popularne Restauracje</h2>
        {loading ? (
          <div className="loading">Ładowanie restauracji...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="restaurants-grid">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Nie znaleziono restauracji spełniających kryteria wyszukiwania.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

