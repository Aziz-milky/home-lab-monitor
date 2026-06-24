package com.homelab.agent.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix = "sentinel")
public class AgentConfig {

    private Server server = new Server();
    private Agent agent = new Agent();

    public Server getServer() { return server; }
    public void setServer(Server server) { this.server = server; }
    public Agent getAgent() { return agent; }
    public void setAgent(Agent agent) { this.agent = agent; }

    public static class Server {
        private String url;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    public static class Agent {
        private String hostname;
        private String name;
        private String version;
        private int collectionIntervalSeconds = 30;
        private int heartbeatIntervalSeconds = 10;
        private String token;
        private String hostId;
        private boolean dockerEnabled = false;
        private String dockerSocket = "unix:///var/run/docker.sock";
        private String stateFile = "/var/lib/sentinel/agent-state.json";

        public String getHostname() { return hostname; }
        public void setHostname(String hostname) { this.hostname = hostname; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public int getCollectionIntervalSeconds() { return collectionIntervalSeconds; }
        public void setCollectionIntervalSeconds(int collectionIntervalSeconds) { this.collectionIntervalSeconds = collectionIntervalSeconds; }
        public int getHeartbeatIntervalSeconds() { return heartbeatIntervalSeconds; }
        public void setHeartbeatIntervalSeconds(int heartbeatIntervalSeconds) { this.heartbeatIntervalSeconds = heartbeatIntervalSeconds; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getHostId() { return hostId; }
        public void setHostId(String hostId) { this.hostId = hostId; }
        public boolean isDockerEnabled() { return dockerEnabled; }
        public void setDockerEnabled(boolean dockerEnabled) { this.dockerEnabled = dockerEnabled; }
        public String getDockerSocket() { return dockerSocket; }
        public void setDockerSocket(String dockerSocket) { this.dockerSocket = dockerSocket; }
        public String getStateFile() { return stateFile; }
        public void setStateFile(String stateFile) { this.stateFile = stateFile; }
    }
}
