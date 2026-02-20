# Setup Guide

Panduan lengkap untuk setup project SumBagSel dari awal.

## Prerequisites

Pastikan sudah terinstall:
- **Node.js** 20 atau lebih tinggi
- **npm** atau **yarn**
- **Docker** & **Docker Compose** (jika menggunakan Docker)
- **MySQL** 8.0+ (jika tidak menggunakan Docker)
- **Git**

## Metode Instalasi

### Metode 1: Docker (Paling Mudah)

#### Langkah 1: Clone Repository

```bash
git clone https://github.com/yourusername/sumbagsel-project.git
cd sumbagsel-project
```

#### Langkah 2: Setup Environment Variables

**Backend:**
```bash
cd sumbagsel-be
cp env.example .env.development
```

Edit `.env.development` dan ubah minimal:
- `JWT_SECRET` - gunakan string random yang kuat

**Frontend:**
```bash
cd ../sumbagsel-fe
cp env.example .env.local
```

Tidak perlu diubah jika menggunakan default (localhost:3000).

#### Langkah 3: Start Services

```bash
# Dari root project
docker compose -f docker-compose.dev.yml up
```

Tunggu hingga semua container running (bisa lihat di terminal atau dengan `docker ps`).

#### Langkah 4: Setup Database

```bash
# Run migrations
docker exec -it sumbagsel-api-dev npm run migration:run

# (Optional) Seed dummy data
docker exec -it sumbagsel-api-dev npm run seed:participants
```

#### Langkah 5: Akses Aplikasi

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

### Metode 2: Manual Setup (Tanpa Docker)

#### Langkah 1: Clone Repository

```bash
git clone https://github.com/yourusername/sumbagsel-project.git
cd sumbagsel-project
```

#### Langkah 2: Setup MySQL Database

```bash
# Login ke MySQL
mysql -u root -p

# Di dalam MySQL console:
CREATE DATABASE sumbagsel_dev;
CREATE USER 'sumbagsel_dev'@'localhost' IDENTIFIED BY 'sumbagsel_dev';
GRANT ALL PRIVILEGES ON sumbagsel_dev.* TO 'sumbagsel_dev'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Langkah 3: Setup Backend

```bash
cd sumbagsel-be

# Install dependencies
npm install

# Copy dan edit environment file
cp env.example .env.development

# Edit .env.development
# Pastikan DATABASE_URL menggunakan localhost:
# DATABASE_URL=mysql://sumbagsel_dev:sumbagsel_dev@localhost:3306/sumbagsel_dev

# Run migrations
npm run migration:run

# (Optional) Seed dummy data
npm run seed:participants

# Start backend (di terminal ini)
npm run start:dev
```

Backend akan berjalan di http://localhost:3000

#### Langkah 4: Setup Frontend

Buka terminal baru:

```bash
cd sumbagsel-fe

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local jika perlu
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Start frontend
npm run dev
```

Frontend akan berjalan di http://localhost:3001

## Verifikasi Instalasi

### Test Backend

```bash
# Health check
curl http://localhost:3000/health

# Expected response: {"ok":true}
```

### Test Frontend

Buka browser ke http://localhost:3001

### Test Database Connection

**Dengan Docker:**
```bash
docker exec -it sumbagsel-db-dev psql -U sumbagsel_dev -d sumbagsel_dev
```

**Tanpa Docker:**
```bash
psql -U sumbagsel_dev -d sumbagsel_dev -h localhost
```

## Troubleshooting

### Backend tidak bisa connect ke database

**Docker:**
- Pastikan container `sumbagsel-db-dev` running: `docker ps`
- Check logs: `docker compose -f docker-compose.dev.yml logs db`
- Pastikan `DATABASE_URL` menggunakan hostname `db` bukan `localhost`

**Manual:**
- Pastikan MySQL service running: `sudo systemctl status mysql`
- Check database credentials di `.env.development`
- Test connection: `mysql -u sumbagsel_dev -p -h localhost sumbagsel_dev`

### Port sudah digunakan

**Backend (port 3000):**
- Cek proses yang menggunakan port: `lsof -i :3000` atau `netstat -an | grep 3000`
- Kill process atau ubah PORT di `.env.development`

**Frontend (port 3001):**
- Cek proses: `lsof -i :3001`
- Ubah port di `package.json` script atau `.env.local`

**Database (port 3306):**
- Cek: `lsof -i :3306`
- Ubah port di `docker-compose.dev.yml` atau MySQL config

### Migration error

```bash
# Check migration status
npm run migration:show

# Revert last migration jika perlu
npm run migration:revert

# Run migrations lagi
npm run migration:run
```

### Frontend tidak bisa connect ke backend

1. Pastikan backend running di http://localhost:3000
2. Check `NEXT_PUBLIC_API_URL` di `.env.local` (contoh: `http://localhost:3000`)
3. Check browser console untuk error CORS
4. Pastikan backend CORS settings mengizinkan frontend URL

### Docker build error

```bash
# Clean build
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

## Next Steps

Setelah setup berhasil:

1. **Buat user baru** melalui frontend (register)
2. **Login** dengan user yang dibuat
3. **Setup profile** di halaman profile
4. **Test registration** flow
5. **Test admin** login di `/admin`

## Development Tips

- Gunakan `npm run start:dev` untuk hot reload di backend
- Gunakan `npm run dev` untuk hot reload di frontend
- Check logs dengan `docker compose logs -f` untuk Docker
- Gunakan browser DevTools untuk debugging frontend
- Gunakan Postman atau curl untuk test API endpoints
