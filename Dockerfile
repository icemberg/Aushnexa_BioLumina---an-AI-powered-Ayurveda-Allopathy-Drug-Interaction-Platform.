# Stage 1: Build the React Frontend
FROM node:20-alpine as build
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Build the Python Backend and Nginx
FROM python:3.11-slim
WORKDIR /app

# Install OS dependencies, Nginx, and envsubst (gettext-base)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    nginx \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini
COPY data_pipeline ./data_pipeline

# Copy compiled frontend from Stage 1
COPY --from=build /frontend/dist /usr/share/nginx/html

# Setup Nginx configuration template
COPY nginx/nginx.allinone.conf.template /etc/nginx/templates/nginx.allinone.conf.template

# Setup entrypoint script
COPY start-all.sh ./start-all.sh
RUN chmod +x ./start-all.sh

# Render uses the PORT environment variable. We expose 10000 by default.
ENV PYTHONPATH=/app
EXPOSE 10000

CMD ["./start-all.sh"]
