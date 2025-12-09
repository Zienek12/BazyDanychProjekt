package com.jolyvert.online_food.service;

import com.jolyvert.online_food.model.MenuItem;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuItemService {

    @PersistenceContext
    private EntityManager em;

    public List<MenuItem> findByRestaurant(int restaurantId) {
        return em.createNativeQuery(
                        "SELECT * FROM menu_items WHERE restaurant_id = ?", MenuItem.class)
                .setParameter(1, restaurantId)
                .getResultList();
    }

    public MenuItem findById(int id) {
        return (MenuItem) em.createNativeQuery(
                        "SELECT * FROM menu_items WHERE id = ?", MenuItem.class)
                .setParameter(1, id)
                .getSingleResult();
    }

    @Transactional
    public boolean addMenuItem(int restaurantId, int managerId, String name, String description, double price, String category) {
        Number isManager = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM restaurants WHERE id = ? AND manager_id = ?")
                .setParameter(1, restaurantId)
                .setParameter(2, managerId)
                .getSingleResult();

        if (isManager.intValue() == 0) return false;

        em.createNativeQuery(
                        "INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES (?, ?, ?, ?, ?)")
                .setParameter(1, restaurantId)
                .setParameter(2, name)
                .setParameter(3, description)
                .setParameter(4, price)
                .setParameter(5, category)
                .executeUpdate();

        return true;
    }

    @Transactional
    public void deleteMenuItem(int id) {
        em.createNativeQuery("DELETE FROM menu_items WHERE id = ?")
                .setParameter(1, id)
                .executeUpdate();
    }
}
