package com.pm.controller;

import com.pm.dto.DeviceDTO;
import com.pm.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService service;

    @GetMapping("/admission/{admissionId}")
    public List<DeviceDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeviceDTO create(@RequestBody DeviceDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public DeviceDTO update(@PathVariable Long id, @RequestBody DeviceDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/admission/{admissionId}/has-active")
    public boolean hasActiveByType(@PathVariable Long admissionId, @RequestParam String type) {
        return service.hasActiveByType(admissionId, type);
    }

    @GetMapping("/admission/{admissionId}/active-drains")
    public java.util.List<DeviceDTO> getActiveDrains(@PathVariable Long admissionId) {
        return service.getActiveDrains(admissionId);
    }
}
