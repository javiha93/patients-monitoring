package com.pm.controller;

import com.pm.dto.EcgDTO;
import com.pm.service.EcgService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ecgs")
@RequiredArgsConstructor
public class EcgController {

    private final EcgService service;

    @GetMapping("/admission/{admissionId}")
    public List<EcgDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @GetMapping("/{id}")
    public EcgDTO getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EcgDTO create(@RequestBody EcgDTO dto) {
        return service.create(dto);
    }

    @PatchMapping("/{id}/complete")
    public EcgDTO complete(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.complete(
                id,
                body.get("completedBy"),
                body.get("imageData"),
                body.get("imageType"),
                body.get("notes")
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
