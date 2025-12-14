import './MenuItem.css'

// Single menu item component
function MenuItem({ item, onAddToCart }) {
  return (
    <div className="menu-item">
      <div className="menu-item-image">
        <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={item.name} />
      </div>
      <div className="menu-item-info">
        <h3>{item.name}</h3>
        <p className="menu-item-description">{item.description}</p>
        <div className="menu-item-footer">
          <span className="menu-item-price">{item.price.toFixed(2)} zł</span>
          <button 
            className="btn-add-to-cart"
            onClick={() => onAddToCart(item)}
          >
            Dodaj do koszyka
          </button>
        </div>
      </div>
    </div>
  )
}

export default MenuItem

