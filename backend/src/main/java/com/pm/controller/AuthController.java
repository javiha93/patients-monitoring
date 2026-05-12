package com.pm.controller;

import com.pm.dto.AppUserDTO;
import com.pm.dto.LoginRequest;
import com.pm.entity.AppUser;
import com.pm.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            AppUserDTO user = authService.login(req);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(authService.getUserById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seedUser(@RequestBody AppUser user) {
        try {
            AppUser created = authService.createUser(user);
            return ResponseEntity.ok(AppUserDTO.fromEntity(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
