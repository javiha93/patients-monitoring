package com.pm.service;

import com.pm.dto.AppUserDTO;
import com.pm.dto.LoginRequest;
import com.pm.entity.AppUser;
import com.pm.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepo;

    public AppUserDTO login(LoginRequest req) {
        AppUser user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!user.getPassword().equals(req.getPassword())) {
            throw new IllegalArgumentException("Contraseña incorrecta");
        }

        if (!user.getRole().equals(req.getRole())) {
            throw new IllegalArgumentException("Rol incorrecto para este usuario");
        }

        return AppUserDTO.fromEntity(user);
    }

    public AppUserDTO getUserById(Long id) {
        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return AppUserDTO.fromEntity(user);
    }

    public AppUser createUser(AppUser user) {
        if (userRepo.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("El usuario ya existe");
        }
        return userRepo.save(user);
    }
}
