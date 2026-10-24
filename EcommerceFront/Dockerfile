# ETAPA 1: Construcción (Instala dependencias y compila Angular)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# ETAPA 2: Servidor Web (Usa Nginx para servir los archivos estáticos)
FROM nginx:alpine
# IMPORTANTE: Reemplaza "nombre-de-tu-proyecto-angular" con el nombre real de tu carpeta dentro de dist/
COPY --from=build /app/dist/EcommerceFront/browser /usr/share/nginx/html
# Configuración por defecto para que las rutas de Angular funcionen
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
