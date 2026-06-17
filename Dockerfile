# ==============================
# Multi‑stage build for Homelab Monitor
# ==============================
# Build stage – uses Maven wrapper to compile the Spring Boot app
# Requires a JDK that supports Java 26 (e.g. eclipse‑temurin:26‑jdk)
# ==============================
FROM eclipse-temurin:26-jdk as builder

# Install Maven (the project ships a Maven wrapper, but we need Maven for the wrapper to work)
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the whole project (including wrapper) into the image
COPY . /app

# Make the Maven wrapper executable
RUN chmod +x ./mvnw

# Build the jar (skip tests for speed)
RUN ./mvnw -DskipTests package

# ==============================
# Runtime stage – minimal JRE image
# ==============================
FROM eclipse-temurin:26-jre

# Create a non‑root user for safety
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copy the compiled jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the Spring Boot default port
EXPOSE 8080

# Switch to non‑root user
USER appuser

# Run the application
ENTRYPOINT ["java","-jar","/app/app.jar"]
