package com.homelab.monitor.controller;

import com.homelab.monitor.model.Service;
import com.homelab.monitor.service.ServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceService serviceService;

    @GetMapping
    public ResponseEntity<Page<Service>> getAllServices(Pageable pageable) {
        return ResponseEntity.ok(serviceService.getAllServices(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable UUID id) {
        return ResponseEntity.ok(serviceService.getServiceById(id));
    }

    @PostMapping
    public ResponseEntity<Service> createService(@Valid @RequestBody Service service) {
        Service created = serviceService.createService(service);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Service> updateService(@PathVariable UUID id, @Valid @RequestBody Service service) {
        return ResponseEntity.ok(serviceService.updateService(id, service));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable UUID id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
