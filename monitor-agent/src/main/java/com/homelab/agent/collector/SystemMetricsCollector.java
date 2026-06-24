package com.homelab.agent.collector;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SystemMetricsCollector {

    private static final Logger log = LoggerFactory.getLogger(SystemMetricsCollector.class);

    private long prevIdle = 0;
    private long prevTotal = 0;
    private Map<String, long[]> prevNetStats = new HashMap<>();

    public Map<String, Object> collect(String hostname) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("cpu", collectCpu());
        metrics.put("memory", collectMemory());
        metrics.put("disks", collectDisks());
        metrics.put("network", collectNetwork());
        metrics.put("processes", collectProcesses());
        return metrics;
    }

    public Map<String, Object> collectSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("hostname", getHostname());
        info.put("os", System.getProperty("os.name"));
        info.put("osVersion", System.getProperty("os.version"));
        info.put("arch", System.getProperty("os.arch"));
        try {
            info.put("kernelVersion", readFirstLine("/proc/sys/kernel/ostype") + " " + readFirstLine("/proc/sys/kernel/osrelease"));
        } catch (Exception e) {
            info.put("kernelVersion", System.getProperty("os.version"));
        }
        info.put("coreCount", Runtime.getRuntime().availableProcessors());
        info.put("uptimeSeconds", getUptimeSeconds());
        return info;
    }

    private Map<String, Object> collectCpu() {
        Map<String, Object> cpu = new HashMap<>();
        cpu.put("coreCount", Runtime.getRuntime().availableProcessors());

        try {
            List<String> loadAvg = readLines("/proc/loadavg");
            if (!loadAvg.isEmpty()) {
                String[] parts = loadAvg.get(0).split("\\s+");
                cpu.put("loadAvg1", parseDouble(parts[0]));
                cpu.put("loadAvg5", parseDouble(parts[1]));
                cpu.put("loadAvg15", parseDouble(parts[2]));
            }
        } catch (Exception e) {
            log.warn("Cannot read /proc/loadavg: {}", e.getMessage());
        }

        try {
            List<String> statLines = readLines("/proc/stat").stream()
                    .filter(l -> l.startsWith("cpu"))
                    .collect(Collectors.toList());

            List<Double> coreUsages = new ArrayList<>();
            long totalIdle = 0;
            long totalAll = 0;

            for (String line : statLines) {
                if (line.startsWith("cpu ") || line.startsWith("cpu")) {
                    String[] parts = line.trim().split("\\s+");
                    if (parts.length < 5) continue;

                    long user = Long.parseLong(parts[1]);
                    long nice = Long.parseLong(parts[2]);
                    long sys = Long.parseLong(parts[3]);
                    long idle = Long.parseLong(parts[4]);
                    long iowait = parts.length > 5 ? Long.parseLong(parts[5]) : 0;
                    long irq = parts.length > 6 ? Long.parseLong(parts[6]) : 0;
                    long softirq = parts.length > 7 ? Long.parseLong(parts[7]) : 0;
                    long steal = parts.length > 8 ? Long.parseLong(parts[8]) : 0;

                    long total = user + nice + sys + idle + iowait + irq + softirq + steal;

                    if (line.startsWith("cpu ")) {
                        if (prevTotal > 0) {
                            long deltaTotal = total - prevTotal;
                            long deltaIdle = idle - prevIdle;
                            double usage = deltaTotal > 0 ? 100.0 * (deltaTotal - deltaIdle) / deltaTotal : 0.0;
                            cpu.put("usagePercent", Math.round(usage * 10.0) / 10.0);
                        } else {
                            cpu.put("usagePercent", 0.0);
                        }
                        prevTotal = total;
                        prevIdle = idle;
                    } else {
                        if (!coreUsages.isEmpty() || !line.startsWith("cpu0")) {
                            if (prevNetStats.containsKey(line.substring(0, line.indexOf(' ')))) {
                                // per-core deltas could be tracked, skip for now
                            }
                        }
                    }
                }
            }

            if (coreUsages.isEmpty()) {
                cpu.put("coreUsages", coreUsages);
            }
        } catch (Exception e) {
            log.warn("Cannot read /proc/stat: {}", e.getMessage());
            cpu.put("usagePercent", 0.0);
        }

        return cpu;
    }

    private Map<String, Object> collectMemory() {
        Map<String, Object> mem = new HashMap<>();
        try {
            Map<String, Long> memInfo = new HashMap<>();
            for (String line : readLines("/proc/meminfo")) {
                String[] parts = line.split(":\\s+");
                if (parts.length >= 2) {
                    String key = parts[0];
                    String value = parts[1].replace(" kB", "").trim();
                    memInfo.put(key, Long.parseLong(value) * 1024);
                }
            }

            long total = memInfo.getOrDefault("MemTotal", 0L);
            long free = memInfo.getOrDefault("MemFree", 0L);
            long buffers = memInfo.getOrDefault("Buffers", 0L);
            long cached = memInfo.getOrDefault("Cached", 0L);

            mem.put("totalBytes", total);
            mem.put("usedBytes", total - free);
            mem.put("freeBytes", free);
            mem.put("cachedBytes", cached + buffers);

            long swapTotal = memInfo.getOrDefault("SwapTotal", 0L);
            long swapFree = memInfo.getOrDefault("SwapFree", 0L);
            mem.put("swapTotalBytes", swapTotal);
            mem.put("swapUsedBytes", swapTotal - swapFree);
        } catch (Exception e) {
            log.warn("Cannot read /proc/meminfo: {}", e.getMessage());
        }
        return mem;
    }

    private List<Map<String, Object>> collectDisks() {
        List<Map<String, Object>> disks = new ArrayList<>();
        try {
            for (String line : readLines("/proc/mounts")) {
                String[] parts = line.split("\\s+");
                if (parts.length < 2) continue;
                String device = parts[0];
                String mountPoint = parts[1];
                String fstype = parts[2];

                if (fstype.startsWith("overlay") || fstype.equals("proc") || fstype.equals("sysfs")
                        || fstype.equals("devtmpfs") || fstype.equals("tmpfs")
                        || fstype.equals("cgroup") || fstype.equals("cgroup2")
                        || fstype.equals("pstore") || fstype.equals("securityfs")
                        || fstype.equals("autofs") || fstype.equals("devpts")
                        || fstype.equals("mqueue") || fstype.equals("hugetlbfs")
                        || fstype.equals("bpf") || fstype.equals("debugfs")
                        || fstype.equals("tracefs") || fstype.equals("configfs")
                        || fstype.equals("fusectl") || fstype.equals("efivarfs")
                        || fstype.equals("fuse.lxcfs")) continue;

                File mount = new File(mountPoint);
                if (!mount.exists() || !mount.isDirectory()) continue;

                long total = mount.getTotalSpace();
                long free = mount.getUsableSpace();
                long used = total - free;

                Map<String, Object> disk = new HashMap<>();
                disk.put("mountPoint", mountPoint);
                disk.put("device", device);
                disk.put("fstype", fstype);
                disk.put("totalBytes", total);
                disk.put("usedBytes", used);
                disk.put("freeBytes", free);
                disk.put("usagePercent", total > 0 ? Math.round(10000.0 * used / total) / 100.0 : 0.0);
                disks.add(disk);
            }
        } catch (Exception e) {
            log.warn("Cannot read /proc/mounts: {}", e.getMessage());
        }
        if (disks.isEmpty()) {
            for (File root : File.listRoots()) {
                long total = root.getTotalSpace();
                long free = root.getUsableSpace();
                long used = total - free;
                Map<String, Object> disk = new HashMap<>();
                disk.put("mountPoint", root.getPath());
                disk.put("device", "");
                disk.put("fstype", "");
                disk.put("totalBytes", total);
                disk.put("usedBytes", used);
                disk.put("freeBytes", free);
                disk.put("usagePercent", total > 0 ? Math.round(10000.0 * used / total) / 100.0 : 0.0);
                disks.add(disk);
            }
        }
        return disks;
    }

    private Map<String, Object> collectNetwork() {
        Map<String, Object> net = new HashMap<>();
        List<Map<String, Object>> interfaces = new ArrayList<>();
        try {
            for (String line : readLines("/proc/net/dev")) {
                if (!line.contains(":")) continue;
                String[] parts = line.trim().split("\\s+");
                String ifaceName = parts[0].replace(":", "").trim();
                if (ifaceName.equals("lo") || ifaceName.startsWith("veth") || ifaceName.startsWith("docker")) continue;

                long rxBytes = Long.parseLong(parts[1]);
                long rxErrors = Long.parseLong(parts[2]);
                long rxDrops = Long.parseLong(parts[3]);
                long txBytes = Long.parseLong(parts[9]);
                long txErrors = Long.parseLong(parts[10]);
                long txDrops = Long.parseLong(parts[11]);

                Map<String, Object> iface = new HashMap<>();
                iface.put("interfaceName", ifaceName);

                long[] prev = prevNetStats.get(ifaceName);
                if (prev != null) {
                    long deltaRx = rxBytes - prev[0];
                    long deltaTx = txBytes - prev[1];
                    iface.put("rxBytesPerSec", deltaRx > 0 ? deltaRx : 0);
                    iface.put("txBytesPerSec", deltaTx > 0 ? deltaTx : 0);
                } else {
                    iface.put("rxBytesPerSec", 0L);
                    iface.put("txBytesPerSec", 0L);
                }
                prevNetStats.put(ifaceName, new long[]{rxBytes, txBytes});

                iface.put("rxBytes", rxBytes);
                iface.put("txBytes", txBytes);
                iface.put("rxErrors", rxErrors);
                iface.put("txErrors", txErrors);
                iface.put("rxDrops", rxDrops);
                iface.put("txDrops", txDrops);
                interfaces.add(iface);
            }
        } catch (Exception e) {
            log.warn("Cannot read /proc/net/dev: {}", e.getMessage());
        }
        net.put("interfaces", interfaces);
        return net;
    }

    private List<Map<String, Object>> collectProcesses() {
        List<Map<String, Object>> processes = new ArrayList<>();
        try {
            ProcessBuilder pb = new ProcessBuilder("ps", "aux", "--no-headers", "--sort=-%cpu");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String output;
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                output = r.lines().limit(30).collect(Collectors.joining("\n"));
            }
            p.waitFor();

            for (String line : output.split("\n")) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split("\\s+");
                if (parts.length < 11) continue;

                try {
                    Map<String, Object> proc = new HashMap<>();
                    proc.put("pid", Integer.parseInt(parts[1]));
                    proc.put("cpuPercent", parseDouble(parts[2]));
                    proc.put("memoryPercent", parseDouble(parts[3]));
                    proc.put("state", parts[7]);

                    String fullCommand = parts[10];
                    for (int i = 11; i < parts.length; i++) {
                        fullCommand += " " + parts[i];
                    }
                    // Extract process name (basename of first arg) for 'name' field
                    String procName = parts[10].replaceAll("^\\(|\\)$", "");
                    if (procName.contains("/")) {
                        procName = procName.substring(procName.lastIndexOf('/') + 1);
                    }
                    if (procName.length() > 255) procName = procName.substring(0, 252) + "...";
                    proc.put("name", procName);
                    if (fullCommand.length() > 2000) fullCommand = fullCommand.substring(0, 1997) + "...";
                    proc.put("command", fullCommand);

                    long memBytes = (long) (parseDouble(parts[5]) * 1024); // RSS in KB
                    proc.put("memoryBytes", memBytes);

                    processes.add(proc);
                } catch (Exception ignored) {
                }
            }
        } catch (Exception e) {
            log.warn("Cannot run ps aux: {}", e.getMessage());
        }
        return processes;
    }

    private long getUptimeSeconds() {
        try {
            String line = readFirstLine("/proc/uptime");
            if (line != null) {
                return (long) Double.parseDouble(line.split("\\s+")[0]);
            }
        } catch (Exception e) {
            log.warn("Cannot read /proc/uptime: {}", e.getMessage());
        }
        return 0;
    }

    private String getHostname() {
        try {
            return readFirstLine("/proc/sys/kernel/hostname");
        } catch (Exception e) {
            try {
                ProcessBuilder pb = new ProcessBuilder("hostname");
                pb.redirectErrorStream(true);
                Process p = pb.start();
                try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                    return r.readLine();
                }
            } catch (Exception e2) {
                return "unknown";
            }
        }
    }

    private String readFirstLine(String path) throws Exception {
        return Files.lines(Paths.get(path)).findFirst().orElse(null);
    }

    private List<String> readLines(String path) throws Exception {
        return Files.readAllLines(Paths.get(path));
    }

    private double parseDouble(String s) {
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
