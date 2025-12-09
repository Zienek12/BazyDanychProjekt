package com.jolyvert.online_food.controller;


import com.jolyvert.online_food.dto.RestaurantDto;
import com.jolyvert.online_food.model.Restaurant;
import com.jolyvert.online_food.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService service;

    public RestaurantController(RestaurantService service) {
        this.service = service;
    }

    @GetMapping
    public List<Restaurant> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Restaurant getById(@PathVariable int id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody RestaurantDto restaurantDto) {
        service.createRestaurant(restaurantDto.getName(), restaurantDto.getAddress(), restaurantDto.getManagerId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        service.deleteRestaurant(id);
        return ResponseEntity.ok().build();
    }
}
