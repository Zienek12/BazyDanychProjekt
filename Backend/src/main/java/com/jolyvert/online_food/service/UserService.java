package com.jolyvert.online_food.service;

import com.jolyvert.online_food.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @PersistenceContext
    private EntityManager em;


    @Transactional
    public boolean registerUser(String name, String email, String password) {
        Number exists = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM users WHERE email = ?")
                .setParameter(1, email)
                .getSingleResult();

        if (exists.intValue() > 0) {
            return false;
        }

        em.createNativeQuery(
                        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
                .setParameter(1, name)
                .setParameter(2, email)
                .setParameter(3, password)
                .executeUpdate();

        return true;
    }

    public User findById(int id) {
        return (User) em.createNativeQuery("SELECT * FROM users WHERE id = ?", User.class)
                .setParameter(1, id)
                .getSingleResult();
    }

    public List<User> findAll() {
        return em.createNativeQuery("SELECT * FROM users", User.class)
                .getResultList();
    }

    public void deleteUser(int id) {
        em.createNativeQuery("DELETE FROM users WHERE id = ?")
                .setParameter(1, id)
                .executeUpdate();
    }
}

