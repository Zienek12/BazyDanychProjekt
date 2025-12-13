package com.jolyvert.online_food.controller;

import com.jolyvert.online_food.dto.CreateOrderDto;
import com.jolyvert.online_food.model.Order;
import com.jolyvert.online_food.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CreateOrderDto createOrderDto) {
        service.createOrder(createOrderDto.getUserId(), createOrderDto.getRestaurantId(), createOrderDto.getMenuItems(), createOrderDto.getQuantities());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public Order getById(@PathVariable int id) {
        return service.findById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Order> getByUser(@PathVariable int userId) {
        return service.findByUser(userId);
    }

    @GetMapping("/restaurant/{restaurantId}")
    public List<Order> getByRestaurant(@PathVariable int restaurantId) {
        return service.findByRestaurant(restaurantId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        service.deleteOrder(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable int orderId,
                                             @RequestParam String status) {
        service.updateOrderStatus(orderId, status);
        return ResponseEntity.ok().build();
    }

}
