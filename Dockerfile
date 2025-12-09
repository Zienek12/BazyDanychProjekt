############################
# Backend build and runtime #
############################
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /backend

# Build Spring Boot backend
COPY Backend/pom.xml .
COPY Backend/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy AS backend-runtime
WORKDIR /app
COPY --from=backend-build /backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

############################
# Frontend build and serve #
############################
FROM node:20-alpine AS frontend-build
WORKDIR /frontend

# Install dependencies separately for better caching
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci

# Build React frontend
COPY Frontend .
RUN npm run build

FROM nginx:1.27-alpine AS frontend-runtime
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

