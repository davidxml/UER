# UER backend — multi-stage build (Spring Boot 4 / Java 21).
#
# Build:  docker build -t uer-backend ./backend
# Run:    docker run -p 8080:8080 \
#           -e DB_PASSWORD=... -e JWT_SECRET=... -e RESPONDER_PIN=... \
#           -e CORS_ORIGINS=https://reporters.example,https://responders.example \
#           uer-backend
#
# Render: runtime: docker, rootDir: backend, dockerfilePath: ./Dockerfile.
# PORT is injected by Render and picked up by server.port=${PORT:8080}.

# ---------- build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cap Maven's JVM: Render build containers are memory-constrained and the
# default "25% of host RAM" heuristic is unreliable inside containers.
ENV MAVEN_OPTS="-Xms64m -Xmx512m -XX:MaxMetaspaceSize=256m -Xss1m"

# 1) Resolve dependencies in a dedicated layer so app-only edits stay fast.
#    The package step below is authoritative; go-offline can miss plugins.
COPY pom.xml ./
RUN mvn -B -ntp -q dependency:go-offline || true

# 2) Compile and package. Tests are skipped: they need a live database and
#    belong in CI, not in an image build.
COPY src ./src
RUN mvn -B -ntp -Dmaven.test.skip=true package

# ---------- runtime ----------
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app

# Run unprivileged.
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app --home-dir /app --shell /usr/sbin/nologin app

# Wildcard keeps this working when the pom version changes.
# (.jar.original does not match *.jar)
COPY --from=build --chown=app:app /build/target/*.jar /app/app.jar

ENV TZ=UTC \
    JAVA_OPTS=""

# - exec: lets Render's SIGTERM reach the JVM for clean shutdown.
# - Explicit -Xmx instead of MaxRAMPercentage: deterministic on a 512 MB
#   free instance, where heap + metaspace + threads otherwise exceed the limit.
# - SerialGC: lower overhead than G1 for a small, low-throughput service.
# - $JAVA_OPTS last so Render/dashboards can override any of the above.
ENTRYPOINT ["sh", "-c", "exec java -Xms64m -Xmx256m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=48m -XX:MaxDirectMemorySize=32m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError $JAVA_OPTS -jar /app/app.jar"]

USER app
EXPOSE 8080
