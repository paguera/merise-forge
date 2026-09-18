# ==========================================
# Stage 1: Build de l'application React
# ==========================================
FROM docker.io/library/node:22-alpine AS build

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation propre des dépendances
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copie des fichiers source
COPY . .

# Compilation pour la production
RUN npm run build

# ==========================================
# Stage 2: Image de production Nginx
# ==========================================
FROM docker.io/library/nginx:stable-alpine

# Configuration Nginx optimisée et durcie (SPA, Gzip, Caching, Sécurité)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du bundle généré depuis l'étape de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
