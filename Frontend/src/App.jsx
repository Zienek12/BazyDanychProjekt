import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import RestaurantDetails from './pages/RestaurantDetails'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import OrderHistory from './pages/OrderHistory'
import RestaurantDashboard from './pages/RestaurantDashboard'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/restaurant/:id" element={<RestaurantDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
