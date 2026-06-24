package com.homelab.agent.collector;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DockerMetricsCollector {

    private static final Logger log = LoggerFactory.getLogger(DockerMetricsCollector.class);

    public List<Map<String, Object>> collect(String dockerSocketPath) {
        List<Map<String, Object>> containers = new ArrayList<>();

        if (!isDockerAvailable()) {
            return containers;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "ps", "--all",
                    "--format", "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.RestartCount}}");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String output;
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                output = r.lines().collect(Collectors.joining("\n"));
            }
            int exitCode = p.waitFor();

            if (exitCode != 0) {
                log.warn("docker ps exited with code {}", exitCode);
                return containers;
            }

            for (String line : output.split("\n")) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split("\t", 5);
                if (parts.length < 5) continue;

                String id = parts[0];
                String name = parts[1];
                String image = parts[2];
                String status = parts[3];
                String restartCount = parts[4];

                String state = parseState(status);

                Map<String, Object> entry = new HashMap<>();
                entry.put("containerId", id);
                entry.put("containerName", name);
                entry.put("imageName", image);
                entry.put("status", state);
                entry.put("restartCount", parseInt(restartCount, 0));

                if ("RUNNING".equals(state)) {
                    getContainerStats(name, entry);
                }

                containers.add(entry);
            }
        } catch (Exception e) {
            log.warn("Docker collection failed: {}", e.getMessage());
        }

        return containers;
    }

    private void getContainerStats(String containerName, Map<String, Object> entry) {
        if (containerName == null || containerName.isEmpty()) return;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "stats", "--no-stream",
                    "--format", "{{.CPUPerc}}\t{{.MemUsage}}",
                    containerName);
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String output;
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                output = r.lines().collect(Collectors.joining("\n"));
            }
            p.waitFor();

            String[] lines = output.trim().split("\n");
            if (lines.length > 0) {
                String[] parts = lines[0].split("\t");
                if (parts.length >= 2) {
                    String cpuStr = parts[0].replace("%", "").trim();
                    entry.put("cpuPercent", parseDouble(cpuStr, 0.0));

                    String memStr = parts[1];
                    if (memStr.contains("/")) {
                        String usedStr = memStr.split("/")[0].trim();
                        entry.put("memoryUsedBytes", parseMemoryBytes(usedStr));
                        String limitStr = memStr.split("/")[1].trim();
                        entry.put("memoryLimitBytes", parseMemoryBytes(limitStr));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Cannot get stats for {}: {}", containerName, e.getMessage());
        }
    }

    private boolean isDockerAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("docker", "version", "--format", "{{.Server.Version}}");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            int exitCode = p.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String parseState(String status) {
        if (status == null) return "UNKNOWN";
        if (status.startsWith("Up")) return "RUNNING";
        if (status.startsWith("Exited")) return "STOPPED";
        if (status.startsWith("Paused")) return "PAUSED";
        if (status.startsWith("Restarting")) return "RESTARTING";
        return "UNKNOWN";
    }

    private int parseInt(String s, int def) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return def; }
    }

    private double parseDouble(String s, double def) {
        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return def; }
    }

    private long parseMemoryBytes(String s) {
        if (s == null || s.isEmpty()) return 0;
        s = s.trim().toLowerCase();
        try {
            if (s.endsWith("kib") || s.endsWith("ki")) {
                return (long) (Double.parseDouble(s.replaceAll("[a-z]", "")) * 1024);
            } else if (s.endsWith("mib") || s.endsWith("mi")) {
                return (long) (Double.parseDouble(s.replaceAll("[a-z]", "")) * 1024 * 1024);
            } else if (s.endsWith("gib") || s.endsWith("gi")) {
                return (long) (Double.parseDouble(s.replaceAll("[a-z]", "")) * 1024 * 1024 * 1024);
            } else if (s.endsWith("kb")) {
                return (long) (Double.parseDouble(s.replaceAll("[a-z]", "")) * 1000);
            } else if (s.endsWith("mb")) {
                return (long) (Double.parseDouble(s.replaceAll("[a-z]", "")) * 1000 * 1000);
            } else if (s.endsWith("gb")) {
                return (long) (Double.parseDouble(s.replaceAll("[a-z]", "")) * 1000 * 1000 * 1000);
            } else if (s.endsWith("b")) {
                return Long.parseLong(s.replaceAll("[a-z]", ""));
            }
            return Long.parseLong(s.replaceAll("[a-z]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
