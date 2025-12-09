import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' // 'customer' lub 'restaurant'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne!')
      return
    }

    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }

    setLoading(true)
    
    try {
      const { password, confirmPassword, role, ...userDataForBackend } = formData
      console.log('Registering user with data:', { ...userDataForBackend, password: '***', role })
      const result = await register({ ...userDataForBackend, role })
      
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Błąd rejestracji')
      }
    } catch (err) {
      setError('Wystąpił błąd podczas rejestracji')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Zarejestruj się</h1>
        <p className="auth-subtitle">Utwórz nowe konto i zacznij zamawiać jedzenie.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Imię i nazwisko</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Jan Kowalski"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="twoj@email.pl"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Typ konta</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="customer">Klient</option>
              <option value="restaurant">Restaurator</option>
            </select>
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
              {formData.role === 'restaurant' 
                ? 'Jako restaurator będziesz mógł zarządzać restauracją i przyjmować zamówienia.'
                : 'Jako klient będziesz mógł zamawiać jedzenie z restauracji.'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Potwierdź hasło</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="auth-footer">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}

export default Register

