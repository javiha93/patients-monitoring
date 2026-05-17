package com.pm.controller;

import com.pm.entity.LocationStatus;
import com.pm.repository.LocationStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationStatusController {

    private final LocationStatusRepository repo;

    @GetMapping("/status")
    public List<LocationStatus> getAll() {
        return repo.findAll();
    }

    @PatchMapping("/{location}/status")
    public LocationStatus update(
            @PathVariable String location,
            @RequestBody Map<String, Object> body) {
        LocationStatus ls = repo.findById(location)
                .orElse(LocationStatus.builder().location(location).build());
        if (body.containsKey("clean")) {
            ls.setClean((Boolean) body.get("clean"));
            if (ls.isClean()) {
                ls.setPriority(null);
            }
        }
        if (body.containsKey("priority")) {
            Object p = body.get("priority");
            ls.setPriority(p != null ? ((Number) p).intValue() : null);
        }
        return repo.save(ls);
    }
}
