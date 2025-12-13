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
    public boolean registerUser(String name, String email, String password, String role) {
        Number exists = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM users WHERE email = ?")
                .setParameter(1, email)
                .getSingleResult();

        if (exists.intValue() > 0) {
            return false;
        }

        em.createNativeQuery(
                        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)")
                .setParameter(1, name)
                .setParameter(2, email)
                .setParameter(3, password)
                .setParameter(4, role)
                .executeUpdate();

        return true;
    }

    public User login(String email, String password) {
        try {
            List<User> results = em.createNativeQuery(
                            "SELECT * FROM users WHERE email = ? AND password = ?",
                            User.class)
                    .setParameter(1, email)
                    .setParameter(2, password)
                    .getResultList();
            
            if (results.isEmpty()) {
                return null; // Użytkownik nie istnieje lub hasło nieprawidłowe
            }
            
            return results.get(0);
        } catch (Exception e) {
            // Log exception if needed, but return null for any query errors
            return null;
        }
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

