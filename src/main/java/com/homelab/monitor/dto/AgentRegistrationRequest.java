package com.homelab.monitor.dto;

import com.homelab.monitor.model.HostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentRegistrationRequest {
    private String hostname;
    private String os;
    private String arch;
    private String kernelVersion;
    private HostType hostType;
    private String ipAddress;
    private String name;
}
