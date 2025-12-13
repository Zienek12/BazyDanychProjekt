import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  // Registration message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear state after display
      navigate(location.pathname, { replace: true, state: {} })
    }
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }))
    }
  }, [location, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Błąd logowania')
      }
    } catch (err) {
      setError('Wystąpił błąd podczas logowania')
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
        <h1>Zaloguj się</h1>
        <p className="auth-subtitle">Witaj z powrotem! Zaloguj się do swojego konta.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
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
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          {successMessage && (
            <div className="success-message" style={{ 
              backgroundColor: '#d4edda', 
              color: '#155724', 
              padding: '0.75rem', 
              borderRadius: '0.25rem', 
              marginBottom: '1rem',
              border: '1px solid #c3e6cb'
            }}>
              {successMessage}
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}

export default Login

