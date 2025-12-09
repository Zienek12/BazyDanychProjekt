package com.jolyvert.online_food.model;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "menu_items")
@Data
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(cascade = CascadeType.ALL)
    private Restaurant restaurant;

    private String name;
    private String description;
    private Double price;
    private String category;

    public MenuItem() {}
}

