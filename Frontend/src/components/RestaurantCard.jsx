import { Link } from 'react-router-dom'
import './RestaurantCard.css'

// Restaurant card component
function RestaurantCard({ restaurant }) {
  return (
    <Link to={`/restaurant/${restaurant.id}`} className="restaurant-card">
      <div className="restaurant-image">
        <img src={restaurant.image} alt={restaurant.name} />
        <div className="restaurant-category">{restaurant.category}</div>
      </div>
      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
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
        </div>
      </div>
    </Link>
  )
}

export default RestaurantCard

