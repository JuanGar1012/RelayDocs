FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY services/document-service/pom.xml services/document-service/pom.xml
RUN mvn -f services/document-service/pom.xml -q -DskipTests dependency:go-offline

COPY services/document-service/src services/document-service/src
RUN mvn -f services/document-service/pom.xml -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /workspace/services/document-service/target/document-service-0.1.0.jar /app/app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
