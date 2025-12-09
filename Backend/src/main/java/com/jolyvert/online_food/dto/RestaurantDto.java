package com.jolyvert.online_food.dto;

import lombok.Data;

@Data
public class RestaurantDto {
    private String name;
    private String address;
    private Integer managerId;
}
