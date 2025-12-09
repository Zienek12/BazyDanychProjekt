package com.jolyvert.online_food.model;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "order_items")
@Data
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private MenuItem menuItem;
    private Integer quantity;
    private Double price;

    public OrderItem() {}
}
