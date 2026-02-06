# Docker Setup untuk Sumbagsel Frontend

Dokumentasi untuk menjalankan aplikasi frontend menggunakan Docker.

## Prerequisites

- Docker dan Docker Compose terinstall
- Backend API sudah berjalan (atau akan dijalankan bersama dengan docker-compose)

## File Docker

### Dockerfile
Dockerfile untuk production build dengan multi-stage build:
- Stage 1: Build aplikasi Next.js
- Stage 2: Runner dengan hanya production dependencies

### Dockerfile.dev
Dockerfile untuk development dengan hot-reload:
- Install semua dependencies (termasuk dev)
- Volume mount untuk live reload
- Port 3001

## Environment Variables

Buat file `.env` di root project (sama level dengan docker-compose files) dengan variabel berikut:

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Staging
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Menjalankan dengan Docker Compose

### Development

```bash
# Dari root project (sama level dengan docker-compose.dev.yml)
docker compose -f docker-compose.dev.yml up frontend

# Atau jalankan semua service (db, api, frontend)
docker compose -f docker-compose.dev.yml up

# Build ulang jika ada perubahan
docker compose -f docker-compose.dev.yml up --build frontend
```

Frontend akan berjalan di: http://localhost:3001

### Staging

```bash
docker compose -f docker-compose.staging.yml up frontend

# Atau dengan build
docker compose -f docker-compose.staging.yml up --build frontend
```

Frontend akan berjalan di: http://localhost:3002

### Production

```bash
docker compose -f docker-compose.prod.yml up frontend

# Atau dengan build
docker compose -f docker-compose.prod.yml up --build frontend
```

Frontend akan berjalan di port yang ditentukan oleh `FRONTEND_PORT` (default: 3003)

## Menjalankan dengan Docker Langsung

### Development

```bash
cd sumbagsel-fe
docker build -f Dockerfile.dev -t sumbagsel-fe:dev .
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  sumbagsel-fe:dev
```

### Production

```bash
cd sumbagsel-fe
docker build -f Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  -t sumbagsel-fe:prod .
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  sumbagsel-fe:prod
```

## Troubleshooting

### Port sudah digunakan
Jika port 3001 sudah digunakan, ubah port mapping:
```bash
docker run -p 3002:3001 ...
```

### Environment variable tidak ter-load
Pastikan environment variable di-set saat build (untuk NEXT_PUBLIC_*) atau saat runtime:
```bash
docker run -e NEXT_PUBLIC_API_URL=http://localhost:3000 ...
```

### Hot reload tidak bekerja di development
Pastikan volume mount sudah benar:
```yaml
volumes:
  - ./sumbagsel-fe:/app
  - node_modules_fe_dev:/app/node_modules
  - /app/.next
```

### Build gagal
Pastikan semua dependencies terinstall:
```bash
docker compose -f docker-compose.dev.yml build --no-cache frontend
```

## Port Mapping

- **Development**: Frontend di port 3001, API di port 3000
- **Staging**: Frontend di port 3002, API di port 3001
- **Production**: Frontend di port 3003 (configurable), API di port 3002 (configurable)

