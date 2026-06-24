package com.homelab.agent.model;

public class SystemInfo {

    private String hostname;
    private String os;
    private String osVersion;
    private String arch;
    private int coreCount;

    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }
    public String getOsVersion() { return osVersion; }
    public void setOsVersion(String osVersion) { this.osVersion = osVersion; }
    public String getArch() { return arch; }
    public void setArch(String arch) { this.arch = arch; }
    public int getCoreCount() { return coreCount; }
    public void setCoreCount(int coreCount) { this.coreCount = coreCount; }
}
