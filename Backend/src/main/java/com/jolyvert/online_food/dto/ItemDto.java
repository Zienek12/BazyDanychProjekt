package com.jolyvert.online_food.dto;

import lombok.Data;

@Data
public class ItemDto {
    private Integer restaurantId;
    private Integer managerId;
    private String name;
    private String description;
    private Double price;
    private String category;
}
