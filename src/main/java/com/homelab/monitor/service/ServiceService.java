package com.homelab.monitor.service;

import com.homelab.monitor.model.Service;
import com.homelab.monitor.repository.ServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@RequiredArgsConstructor
@org.springframework.stereotype.Service
@Transactional
public class ServiceService {

    private final ServiceRepository serviceRepository;

    @Transactional(readOnly = true)
    public Page<Service> getAllServices(Pageable pageable) {
        return serviceRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Service getServiceById(UUID id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Service not found with id: " + id));
    }

    public Service createService(Service service) {
        service.setId(null);
        service.setCreatedAt(LocalDateTime.now());
        return serviceRepository.save(service);
    }

    public Service updateService(UUID id, Service updated) {
        Service existing = getServiceById(id);
        existing.setName(updated.getName());
        existing.setHost(updated.getHost());
        existing.setPort(updated.getPort());
        existing.setServiceType(updated.getServiceType());
        existing.setCheckUrl(updated.getCheckUrl());
        existing.setActive(updated.isActive());
        return serviceRepository.save(existing);
    }

    public void deleteService(UUID id) {
        if (!serviceRepository.existsById(id)) {
            throw new EntityNotFoundException("Service not found with id: " + id);
        }
        serviceRepository.deleteById(id);
    }
}
