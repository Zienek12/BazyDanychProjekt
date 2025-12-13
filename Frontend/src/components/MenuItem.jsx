import './MenuItem.css'

// Single menu item component
function MenuItem({ item, onAddToCart }) {
  const isAvailable = item.available !== false

  return (
    <div className={`menu-item ${!isAvailable ? 'unavailable' : ''}`}>
      <div className="menu-item-image">
        <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={item.name} />
        {!isAvailable && (
          <div className="unavailable-overlay">Niedostępne</div>
        )}
      </div>
      <div className="menu-item-info">
        <h3>{item.name}</h3>
        <p className="menu-item-description">{item.description}</p>
        <div className="menu-item-footer">
          <span className="menu-item-price">{item.price.toFixed(2)} zł</span>
          {isAvailable ? (
            <button 
              className="btn-add-to-cart"
              onClick={() => onAddToCart(item)}
            >
              Dodaj do koszyka
            </button>
          ) : (
            <button className="btn-add-to-cart" disabled>
              Niedostępne
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuItem

