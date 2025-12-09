package com.jolyvert.online_food.dto;

import lombok.Data;

@Data
public class CreateOrderDto {
    private Integer userId;
    private Integer restaurantId;
    private int[] menuItems;
    private int[] quantities;
}
