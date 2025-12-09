package com.jolyvert.online_food.controller;

import com.jolyvert.online_food.dto.ItemDto;
import com.jolyvert.online_food.model.MenuItem;
import com.jolyvert.online_food.service.MenuItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {

    private final MenuItemService service;

    public MenuItemController(MenuItemService service) {
        this.service = service;
    }

    @GetMapping("/restaurant/{restaurantId}")
    public List<MenuItem> getByRestaurant(@PathVariable int restaurantId) {
        return service.findByRestaurant(restaurantId);
    }

    @GetMapping("/{id}")
    public MenuItem getById(@PathVariable int id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<String> add(@RequestBody ItemDto itemDto) {
        boolean success = service.addMenuItem(itemDto.getRestaurantId(), itemDto.getManagerId(), itemDto.getName(), itemDto.getDescription(), itemDto.getPrice(), itemDto.getCategory());
        if (success) return ResponseEntity.ok("Menu item added");
        else return ResponseEntity.badRequest().body("User is not manager of this restaurant");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        service.deleteMenuItem(id);
        return ResponseEntity.ok().build();
    }
}
