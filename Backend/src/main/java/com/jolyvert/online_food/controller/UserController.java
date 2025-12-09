package com.jolyvert.online_food.controller;

import com.jolyvert.online_food.dto.RegisterDto;
import com.jolyvert.online_food.model.User;
import com.jolyvert.online_food.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterDto registerDto) {
        boolean success = service.registerUser(registerDto.getName(), registerDto.getEmail(), registerDto.getPassword());
        if (success) return ResponseEntity.ok("User registered");
        else return ResponseEntity.badRequest().body("Email already exists");
    }

    @GetMapping
    public List<User> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable int id) {
        return service.findById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        service.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
