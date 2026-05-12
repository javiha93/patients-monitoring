package com.pm.dto;

import com.pm.entity.AppUser;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppUserDTO {
    private Long id;
    private String username;
    private String role;
    private String nombreProfesional;
    private String primerApellido;
    private String segundoApellido;
    private String displayName;

    public static AppUserDTO fromEntity(AppUser u) {
        String display = u.getNombreProfesional() + " " + u.getPrimerApellido();
        return AppUserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .role(u.getRole())
                .nombreProfesional(u.getNombreProfesional())
                .primerApellido(u.getPrimerApellido())
                .segundoApellido(u.getSegundoApellido())
                .displayName(display)
                .build();
    }
}
