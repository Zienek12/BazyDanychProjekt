package com.jolyvert.online_food.service;

import com.jolyvert.online_food.model.Restaurant;
import com.jolyvert.online_food.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import com.jolyvert.online_food.service.UserService;

@Service
public class RestaurantService {

    private final UserService userService;

    public RestaurantService(UserService userService) {
        this.userService = userService;
    }

    @PersistenceContext
    private EntityManager em;

    public List<Restaurant> findAll() {
        return em.createNativeQuery("SELECT * FROM restaurants", Restaurant.class)
                .getResultList();
    }

    public Restaurant findById(int id) {
        return (Restaurant) em.createNativeQuery("SELECT * FROM restaurants WHERE id = ?", Restaurant.class)
                .setParameter(1, id)
                .getSingleResult();
    }

    public List<Restaurant> findByManager(int managerId) {
        return em.createNativeQuery("SELECT * FROM restaurants WHERE manager_id = ?", Restaurant.class)
                .setParameter(1, managerId)
                .getResultList();
    }

    @Transactional
    public void createRestaurant(String name, String address, int managerId) {

    //User manager = userService.findById(managerId);

        em.createNativeQuery(
                        "INSERT INTO restaurants (name, address, manager_id) VALUES (?, ?, ?)")
                .setParameter(1, name)
                .setParameter(2, address)
                .setParameter(3, managerId)
                .executeUpdate();
    }

    public void deleteRestaurant(int id) {
        em.createNativeQuery("DELETE FROM restaurants WHERE id = ?")
                .setParameter(1, id)
                .executeUpdate();
    }
}
