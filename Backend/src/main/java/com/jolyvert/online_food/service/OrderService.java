package com.jolyvert.online_food.service;

import com.jolyvert.online_food.model.MenuItem;
import com.jolyvert.online_food.model.Order;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    private MenuItemService menuItemService;

    public OrderService(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void createOrder(int userId, int restaurantId, int[] menuItemIds, int[] quantities) {
        em.createNativeQuery(
                        "INSERT INTO orders (user_id, restaurant_id, created_at, status, total_price) VALUES (?, ?, NOW(), 'pending', 0)")
                .setParameter(1, userId)
                .setParameter(2, restaurantId)
                .executeUpdate();

        Integer orderId = ((Number) em.createNativeQuery("SELECT LAST_INSERT_ID()").getSingleResult()).intValue();

        for (int i = 0; i < menuItemIds.length; i++) {
            MenuItem menuItem = menuItemService.findById(menuItemIds[i]);
            double price = menuItem.getPrice();
            em.createNativeQuery(
                            "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)")
                    .setParameter(1, orderId)
                    .setParameter(2, menuItemIds[i])
                    .setParameter(3, quantities[i])
                    .setParameter(4, price)
                    .executeUpdate();
        }

        em.createNativeQuery(
                        "UPDATE orders SET total_price = (SELECT SUM(quantity * price) FROM order_items WHERE order_id = ?) WHERE id = ?")
                .setParameter(1, orderId)
                .setParameter(2, orderId)
                .executeUpdate();
    }

    public Order findById(int id) {
        return (Order) em.createNativeQuery("SELECT * FROM orders WHERE id = ?", Order.class)
                .setParameter(1, id)
                .getSingleResult();
    }

    public List<Order> findByUser(int userId) {
        return em.createNativeQuery("SELECT * FROM orders WHERE user_id = ?", Order.class)
                .setParameter(1, userId)
                .getResultList();
    }

    @Transactional
    public void deleteOrder(int id) {
        em.createNativeQuery("DELETE FROM order_items WHERE order_id = ?")
                .setParameter(1, id)
                .executeUpdate();

        em.createNativeQuery("DELETE FROM orders WHERE id = ?")
                .setParameter(1, id)
                .executeUpdate();
    }

    @Transactional
    public void updateOrderStatus(int orderId, String status) {
        em.createNativeQuery("UPDATE orders SET status = ? WHERE id = ?")
                .setParameter(1, status)
                .setParameter(2, orderId)
                .executeUpdate();
    }

}
