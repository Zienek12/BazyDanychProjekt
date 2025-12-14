import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { menuItemsAPI, restaurantsAPI } from '../services/api'
import './RestaurantDashboard.css'

// Restaurant management dashboard
function RestaurantDashboard() {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showCreateRestaurantForm, setShowCreateRestaurantForm] = useState(false)
  const [restaurantFormData, setRestaurantFormData] = useState({
    name: '',
    address: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pizza',
    available: true
  })

  useEffect(() => {
    if (user) {
      loadRestaurantData()
    } else {
      setLoading(false)
      setError('Musisz być zalogowany, aby uzyskać dostęp do panelu restauratora')
    }
  }, [user])

  const loadRestaurantData = async () => {
    try {
      setLoading(true)
      const restaurants = await restaurantsAPI.getAll()
      const userRestaurant = restaurants.find(r => r.manager?.id === user.id || r.managerId === user.id)
      
      if (!userRestaurant) {
        setError('')
        return
      }

      setRestaurant(userRestaurant)
      
      const menu = await menuItemsAPI.getByRestaurant(userRestaurant.id)
      // Set default values for menu items
      const menuWithDefaults = menu.map(item => ({
        ...item,
        restaurantId: item.restaurant?.id || item.restaurantId || userRestaurant.id,
        available: item.available !== false
      }))
      setMenuItems(menuWithDefaults)
    } catch (err) {
      setError('Nie udało się załadować danych restauracji')
      console.error('Error loading restaurant data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Pizza',
      available: true
    })
    setEditingItem(null)
    setShowAddForm(true)
  }

  const handleEditItem = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      available: item.available
    })
    setEditingItem(item.id)
    setShowAddForm(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    if (!restaurant) return

    try {
      if (editingItem) {
        // Edit via delete and create (API has no update)
        alert('Edycja pozycji menu nie jest jeszcze dostępna przez API')
        await menuItemsAPI.delete(editingItem)
        await menuItemsAPI.create({
          restaurantId: restaurant.id,
          managerId: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category
        })
      } else {
        await menuItemsAPI.create({
          restaurantId: restaurant.id,
          managerId: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category
        })
      }
      
      await loadRestaurantData()
      setShowAddForm(false)
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Pizza',
        available: true
      })
    } catch (err) {
      const errorMessage = err.message || 'Nie udało się zapisać pozycji menu'
      if (errorMessage.includes('not manager')) {
        alert('Nie jesteś menedżerem tej restauracji')
      } else {
        alert(errorMessage)
      }
      console.error('Error saving menu item:', err)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten produkt?')) {
      return
    }

    try {
      await menuItemsAPI.delete(id)
      await loadRestaurantData()
    } catch (err) {
      alert('Nie udało się usunąć produktu')
      console.error('Error deleting menu item:', err)
    }
  }

  const toggleAvailability = async (id) => {
    alert('Zmiana dostępności nie jest jeszcze dostępna przez API')
  }

  const handleCreateRestaurant = async (e) => {
    e.preventDefault()
    if (!user) return

    try {
      await restaurantsAPI.create({
        name: restaurantFormData.name,
        address: restaurantFormData.address,
        managerId: user.id
      })
      
      await loadRestaurantData()
      setShowCreateRestaurantForm(false)
      setRestaurantFormData({ name: '', address: '' })
    } catch (err) {
      alert('Nie udało się utworzyć restauracji')
      console.error('Error creating restaurant:', err)
    }
  }

  if (loading) {
    return <div className="loading">Ładowanie danych...</div>
  }

  if (!user) {
    return (
      <div className="restaurant-dashboard">
        <div className="error">Musisz być zalogowany, aby uzyskać dostęp do panelu restauratora.</div>
      </div>
    )
  }

  if (!restaurant && !error) {
    return (
      <div className="restaurant-dashboard">
        <div className="create-restaurant-section">
          <h1>Utwórz swoją restaurację</h1>
          <p>Jeszcze nie masz przypisanej restauracji. Utwórz nową, aby móc zarządzać menu i zamówieniami.</p>
          
          {showCreateRestaurantForm ? (
            <div className="add-item-form">
              <h2>Dodaj nową restaurację</h2>
              <form onSubmit={handleCreateRestaurant}>
                <div className="form-group">
                  <label>Nazwa restauracji</label>
                  <input
                    type="text"
                    value={restaurantFormData.name}
                    onChange={(e) => setRestaurantFormData({ ...restaurantFormData, name: e.target.value })}
                    required
                    placeholder="np. Pizzeria Bella"
                  />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <input
                    type="text"
                    value={restaurantFormData.address}
                    onChange={(e) => setRestaurantFormData({ ...restaurantFormData, address: e.target.value })}
                    required
                    placeholder="np. ul. Kwiatowa 10, Wrocław"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Utwórz restaurację
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateRestaurantForm(false)
                      setRestaurantFormData({ name: '', address: '' })
                    }}
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              className="btn-primary" 
              onClick={() => setShowCreateRestaurantForm(true)}
              style={{ marginTop: '1rem' }}
            >
              + Utwórz nową restaurację
            </button>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="restaurant-dashboard">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="restaurant-dashboard">
      <div className="dashboard-header">
        <h1>Panel Restauratora - {restaurant.name}</h1>
        <div className="dashboard-actions">
          <Link to="/orders" className="btn-secondary">
            Zamówienia
          </Link>
          <button className="btn-primary" onClick={handleAddItem}>
            + Dodaj produkt
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-item-form">
          <h2>{editingItem ? 'Edytuj produkt' : 'Dodaj nowy produkt'}</h2>
          <form onSubmit={handleSaveItem}>
            <div className="form-row">
              <div className="form-group">
                <label>Nazwa</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Kategoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Pizza">Pizza</option>
                  <option value="Makarony">Makarony</option>
                  <option value="Desery">Desery</option>
                  <option value="Napoje">Napoje</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Opis</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cena (zł)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                  Dostępne
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingItem ? 'Zapisz zmiany' : 'Dodaj produkt'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingItem(null)
                }}
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="menu-items-section">
        <h2>Menu Restauracji</h2>
        {menuItems.length === 0 ? (
          <div className="no-items">
            <p>Brak produktów w menu. Dodaj pierwszy produkt!</p>
          </div>
        ) : (
          <div className="menu-items-grid">
            {menuItems.map(item => (
              <div key={item.id} className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}>
                <div className="menu-item-header">
                  <h3>{item.name}</h3>
                  <span className={`availability-badge ${item.available ? 'available' : 'unavailable'}`}>
                    {item.available ? 'Dostępne' : 'Niedostępne'}
                  </span>
                </div>
                <p className="menu-item-category">{item.category}</p>
                <p className="menu-item-description">{item.description}</p>
                <div className="menu-item-footer">
                  <span className="menu-item-price">{item.price.toFixed(2)} zł</span>
                  <div className="menu-item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditItem(item)}
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RestaurantDashboard

