# SumBagSel Backend API

NestJS backend API untuk sistem pendaftaran konferensi.

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL 16
- **ORM**: TypeORM 0.3
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator, class-transformer

## Quick Start

### Dengan Docker

```bash
# Dari root project
docker compose -f docker-compose.dev.yml up
```

### Manual Setup

```bash
# Install dependencies
npm install

# Setup environment
cp env.example .env.development
# Edit .env.development

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

## Environment Variables

Lihat `env.example` untuk daftar lengkap environment variables.

## Database Migrations

```bash
# Run migrations
npm run migration:run

# Generate new migration
npm run migration:generate src/migrations/YourMigrationName

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Seeding

```bash
# Seed dummy participants
npm run seed:participants
```

## API Documentation

Base URL: http://localhost:3000

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/google` - Google OAuth
- `GET /auth/me` - Get current user

### User & Profile
- `GET /profiles/me` - Get profile
- `POST /profiles` - Create profile
- `PATCH /profiles/me` - Update profile

### Registration
- `GET /registrations/me` - Get registration
- `POST /registrations` - Create registration
- `PATCH /registrations/me` - Update registration
- `POST /registrations/me/submit` - Submit registration

### Arrival Schedule
- `GET /arrival-schedules/me` - Get arrival schedule
- `POST /arrival-schedules` - Create arrival schedule
- `PATCH /arrival-schedules/me` - Update arrival schedule

### Admin
- `POST /admin/login` - Admin login
- `GET /admin/me` - Get admin info
- `GET /admin/participants` - Get all participants
- `GET /admin/participants/:id` - Get participant detail
- `PATCH /admin/participants/:id/approve` - Approve registration
- `GET /admin/arrival-schedules` - Get all arrival schedules
- `GET /admin/arrival-schedules/summary` - Get summary
- `GET /admin/arrival-schedules/export` - Export CSV
