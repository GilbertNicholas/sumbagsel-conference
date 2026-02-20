# SumBagSel Conference Registration System

Sistem pendaftaran konferensi dengan manajemen peserta dan jadwal kedatangan.

## 🚀 Tech Stack

### Backend
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7
- **Database**: MySQL 8.0
- **ORM**: TypeORM 0.3
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19 + Tailwind CSS 4
- **Form**: React Hook Form + Zod
- **State**: React Hooks

## 📋 Prerequisites

- **Node.js** 20+ dan npm
- **Docker** & **Docker Compose** (opsional, untuk development dengan Docker)
- **MySQL** 8.0+ (jika tidak menggunakan Docker)
- **Git**

## 🛠️ Quick Start

### Opsi 1: Menggunakan Docker (Recommended)

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sumbagsel-project.git
cd sumbagsel-project
```

#### 2. Setup Environment Variables

**Backend:**
```bash
cd sumbagsel-be
cp env.example .env.development
```

Edit `.env.development` sesuai kebutuhan (minimal ubah `JWT_SECRET`).

**Frontend:**
```bash
cd ../sumbagsel-fe
cp env.example .env.local
```

#### 3. Jalankan dengan Docker Compose

```bash
# Dari root project
docker compose -f docker-compose.dev.yml up
```

Atau untuk menjalankan di background:
```bash
docker compose -f docker-compose.dev.yml up -d
```

#### 4. Run Database Migrations

```bash
docker exec -it sumbagsel-api-dev npm run migration:run
```

#### 5. (Optional) Seed Dummy Data

```bash
docker exec -it sumbagsel-api-dev npm run seed:participants
```

#### 6. Akses Aplikasi

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:3306

### Opsi 2: Instalasi Manual (Tanpa Docker)

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sumbagsel-project.git
cd sumbagsel-project
```

#### 2. Setup Database MySQL

```bash
# Login ke MySQL
mysql -u root -p

# Buat database dan user
CREATE DATABASE sumbagsel_dev;
CREATE USER 'sumbagsel_dev'@'localhost' IDENTIFIED BY 'sumbagsel_dev';
GRANT ALL PRIVILEGES ON sumbagsel_dev.* TO 'sumbagsel_dev'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Setup Backend

```bash
cd sumbagsel-be

# Install dependencies
npm install

# Copy environment file
cp env.example .env.development

# Edit .env.development dengan database credentials lokal
# DATABASE_URL=mysql://sumbagsel_dev:sumbagsel_dev@localhost:3306/sumbagsel_dev

# Run migrations
npm run migration:run

# (Optional) Seed dummy data
npm run seed:participants

# Start development server
npm run start:dev
```

Backend akan berjalan di http://localhost:3000

#### 4. Setup Frontend

Buka terminal baru:

```bash
cd sumbagsel-fe

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local jika perlu
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev
```

Frontend akan berjalan di http://localhost:3001

## 📁 Struktur Project

```
sumbagsel-project/
├── sumbagsel-be/              # Backend (NestJS)
│   ├── src/
│   │   ├── entities/         # Database entities
│   │   ├── auth/             # Authentication module
│   │   ├── users/            # Users module
│   │   ├── profiles/         # Profiles module
│   │   ├── registrations/    # Registrations module
│   │   ├── arrival-schedules/# Arrival schedules module
│   │   ├── admin/            # Admin module
│   │   └── migrations/       # Database migrations
│   ├── env.example           # Environment variables template
│   └── package.json
│
├── sumbagsel-fe/              # Frontend (Next.js)
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities & API client
│   ├── env.example           # Environment variables template
│   └── package.json
│
├── docker-compose.dev.yml     # Docker Compose untuk development
├── docker-compose.staging.yml # Docker Compose untuk staging
├── docker-compose.prod.yml    # Docker Compose untuk production
└── README.md                  # File ini
```

## 🔧 Development Commands

### Backend

```bash
cd sumbagsel-be

# Development
npm run start:dev          # Start dengan hot reload

# Database
npm run migration:generate  # Generate migration baru
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration
npm run migration:show     # Show migration status

# Seeding
npm run seed:participants  # Seed dummy participants

# Build
npm run build              # Build untuk production
npm run start:prod         # Start production build
```

### Frontend

```bash
cd sumbagsel-fe

# Development
npm run dev                # Start development server (port 3001)

# Build
npm run build              # Build untuk production
npm run start              # Start production server

# Linting
npm run lint               # Run ESLint
```

## 🐳 Docker Commands

```bash
# Start semua services
docker compose -f docker-compose.dev.yml up

# Start di background
docker compose -f docker-compose.dev.yml up -d

# Stop services
docker compose -f docker-compose.dev.yml down

# Stop dan hapus volumes (HATI-HATI: akan hapus data!)
docker compose -f docker-compose.dev.yml down -v

# Rebuild containers
docker compose -f docker-compose.dev.yml up --build

# View logs
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f db

# Execute command di container
docker exec -it sumbagsel-api-dev npm run migration:run
docker exec -it sumbagsel-api-dev bash
```

## 🔐 Environment Variables

### Backend (sumbagsel-be/.env.development)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | ✅ |
| `JWT_SECRET` | Secret untuk JWT tokens | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ❌ |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | ❌ |
| `FRONTEND_URL` | Frontend URL untuk CORS | ✅ |
| `NODE_ENV` | Environment (development/staging/production) | ✅ |
| `PORT` | Port untuk API server | ✅ |

### Frontend (sumbagsel-fe/.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (tanpa /api) | ✅ |

Lihat file `env.example` di masing-masing folder untuk template lengkap.

## 🗄️ Database Migrations

### Menjalankan Migrations

**Dengan Docker:**
```bash
docker exec -it sumbagsel-api-dev npm run migration:run
```

**Tanpa Docker:**
```bash
cd sumbagsel-be
npm run migration:run
```

### Membuat Migration Baru

```bash
cd sumbagsel-be
npm run migration:generate src/migrations/YourMigrationName
```

## 🐛 Troubleshooting

### Port Already in Use

Jika port sudah digunakan, ubah port di:
- **Backend**: Edit `PORT` di `.env.development` atau `docker-compose.dev.yml`
- **Frontend**: Edit port di `package.json` script atau `docker-compose.dev.yml`

### Database Connection Error

**Dengan Docker:**
```bash
# Check apakah database container running
docker compose -f docker-compose.dev.yml ps

# Check database logs
docker compose -f docker-compose.dev.yml logs db

# Pastikan DATABASE_URL menggunakan hostname 'db' bukan 'localhost'
```

**Tanpa Docker:**
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connection
mysql -u sumbagsel_dev -p -h localhost sumbagsel_dev
```

### Migration Error

```bash
# Check migration status
docker exec -it sumbagsel-api-dev npm run migration:show

# Jika ada error, bisa revert migration terakhir
docker exec -it sumbagsel-api-dev npm run migration:revert
```

### Frontend Tidak Bisa Connect ke Backend

1. Pastikan backend sudah running
2. Check `NEXT_PUBLIC_API_URL` di `.env.local` (contoh: `http://localhost:3000`)
3. Check CORS settings di backend
4. Check browser console untuk error

### Docker Build Error

```bash
# Rebuild tanpa cache
docker compose -f docker-compose.dev.yml build --no-cache

# Remove semua containers dan volumes
docker compose -f docker-compose.dev.yml down -v
docker system prune -a
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register user baru
- `POST /auth/login` - Login dengan email/password
- `GET /auth/google` - Google OAuth login
- `GET /auth/me` - Get current user

### User & Profile
- `GET /profiles/me` - Get current user profile
- `POST /profiles` - Create profile
- `PATCH /profiles/me` - Update profile

### Registration
- `GET /registrations/me` - Get user registration
- `POST /registrations` - Create registration
- `PATCH /registrations/me` - Update registration
- `POST /registrations/me/submit` - Submit registration

### Arrival Schedule
- `GET /arrival-schedules/me` - Get user arrival schedule
- `POST /arrival-schedules` - Create arrival schedule
- `PATCH /arrival-schedules/me` - Update arrival schedule

### Admin
- `POST /admin/login` - Admin login
- `GET /admin/me` - Get admin info
- `GET /admin/participants` - Get all participants
- `GET /admin/participants/:id` - Get participant detail
- `PATCH /admin/participants/:id/approve` - Approve registration
- `GET /admin/arrival-schedules` - Get all arrival schedules
- `GET /admin/arrival-schedules/summary` - Get arrival summary
- `GET /admin/arrival-schedules/export` - Export CSV

## 📝 License

This project is private and proprietary.
