package com.homelab.monitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticIssue {
    private String severity;
    private String type;
    private String description;
    private String suggestedAction;
}
