package com.homelab.monitor.controller;

import com.homelab.monitor.model.ServiceDependency;
import com.homelab.monitor.repository.ServiceDependencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dependencies")
@RequiredArgsConstructor
public class DependencyController {

    private final ServiceDependencyRepository dependencyRepository;

    @GetMapping
    public ResponseEntity<List<ServiceDependency>> getAllDependencies() {
        return ResponseEntity.ok(dependencyRepository.findAll());
    }
}
