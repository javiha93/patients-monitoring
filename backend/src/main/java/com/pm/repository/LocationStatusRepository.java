package com.pm.repository;

import com.pm.entity.LocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationStatusRepository extends JpaRepository<LocationStatus, String> {
}
