package com.homelab.agent.model;

public class AgentRegistrationResponse {

    private String hostId;
    private String agentId;
    private String token;

    public String getHostId() { return hostId; }
    public void setHostId(String hostId) { this.hostId = hostId; }
    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
