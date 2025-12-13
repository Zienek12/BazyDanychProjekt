import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isUsingMockAPI, toggleMockAPI } from '../services/api'
import './Layout.css'

function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout, isCustomer, isRestaurant, isAdmin } = useAuth()
  const [showMockToggle, setShowMockToggle] = useState(false)

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            <h1>🍽️ FoodOrder</h1>
          </Link>
          
          {/* Mock API button only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mock-api-toggle">
              <button
                className={`mock-toggle-btn ${isUsingMockAPI() ? 'active' : ''}`}
                onClick={() => setShowMockToggle(!showMockToggle)}
                title="Przełącz Mock API"
              >
                {isUsingMockAPI() ? '🔧 Mock ON' : '🔧 Mock OFF'}
              </button>
              {showMockToggle && (
                <div className="mock-toggle-menu">
                  <p>Tryb testowy:</p>
                  <button
                    onClick={() => {
                      toggleMockAPI(true)
                      setShowMockToggle(false)
                    }}
                    className={isUsingMockAPI() ? 'active' : ''}
                  >
                    Włącz Mock API
                  </button>
                  <button
                    onClick={() => {
                      toggleMockAPI(false)
                      setShowMockToggle(false)
                    }}
                    className={!isUsingMockAPI() ? 'active' : ''}
                  >
                    Wyłącz Mock API
                  </button>
                  <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
                  <button
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć dane zalogowanego użytkownika? To Cię wyloguje.')) {
                        localStorage.removeItem('user')
                        localStorage.removeItem('token')
                        window.dispatchEvent(new Event('localStorageChange'))
                        setTimeout(() => window.location.reload(), 100)
                      }
                      setShowMockToggle(false)
                    }}
                    style={{ color: '#ed8936', marginTop: '0.5rem' }}
                  >
                    👤 Usuń dane użytkownika
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz wyczyścić wszystkie dane z localStorage? To wyloguje Cię i usunie wszystkie zapisane dane.')) {
                        localStorage.clear()
                        window.location.reload()
                      }
                      setShowMockToggle(false)
                    }}
                    style={{ color: '#f56565', marginTop: '0.5rem' }}
                  >
                    🗑️ Wyczyść localStorage
                  </button>
                </div>
              )}
            </div>
          )}
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link">Restauracje</Link>
            {user ? (
              <>
                {isCustomer && (
                  <>
                    <Link to="/cart" className="nav-link">Koszyk</Link>
                    <Link to="/order-history" className="nav-link">Moje Zamówienia</Link>
                  </>
                )}
                {(isRestaurant || user?.role === 'restaurant' || user?.role === 'manager') && (
                  <>
                    <Link to="/restaurant-dashboard" className="nav-link">Panel Restauratora</Link>
                    <Link to="/orders" className="nav-link">Zamówienia</Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin-dashboard" className="nav-link">Panel Admina</Link>
                )}
                <span className="nav-link user-name">{user.name}</span>
                <button className="btn-logout" onClick={logout}>
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Zaloguj</Link>
                <Link to="/register" className="nav-link btn-register">Zarejestruj</Link>
              </>
            )}
          </nav>
          
          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 FoodOrder. Wszelkie prawa zastrzeżone.</p>
          <div className="footer-links">
            <Link to="/">O nas</Link>
            <Link to="/">Kontakt</Link>
            <Link to="/">Regulamin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout

