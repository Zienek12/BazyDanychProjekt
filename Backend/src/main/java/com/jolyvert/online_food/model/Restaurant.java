package com.jolyvert.online_food.model;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "restaurants")
@Data
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String address;

    @OneToOne(cascade = CascadeType.ALL)
    private User manager;

    public Restaurant() {}
}

