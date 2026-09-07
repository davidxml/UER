# Multi-stage build for the UER Spring Boot backend (Java 21).
#
# Build with Maven, run with a slim JRE. Render builds this via
# `runtime: docker` in render.yaml — no Nixpacks detection involved, so
# JAVA_HOME is guaranteed.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -B dependency:go-offline -q || true
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/uer-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]