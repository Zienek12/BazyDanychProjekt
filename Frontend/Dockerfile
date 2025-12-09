FROM node:20-alpine AS builder

WORKDIR /app

# Instalacja zależności
COPY package.json package-lock.json ./
RUN npm ci

# Build aplikacji
COPY . .
RUN npm run build

# Serwowanie statycznych plików przez Nginx
FROM nginx:1.27-alpine AS runner

# Konfiguracja SPA fallback dla React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Skopiuj zbudowaną aplikację
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

