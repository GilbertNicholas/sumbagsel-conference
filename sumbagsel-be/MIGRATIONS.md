# Database Migrations Guide

## Setup

Migrations menggunakan TypeORM dan sudah dikonfigurasi untuk bekerja dengan PostgreSQL.

## Menjalankan Migrations

### Di Container Docker (Development)

```bash
# Masuk ke container API
docker compose -f ../docker-compose.dev.yml exec api sh

# Di dalam container, jalankan migration
npm run migration:run
```

### Di Local (tanpa Docker)

```bash
# Pastikan DATABASE_URL sudah diset di .env.development
cd sumbagsel-be
npm run migration:run
```

## Migration Commands

### Menjalankan semua pending migrations
```bash
npm run migration:run
```

### Revert migration terakhir
```bash
npm run migration:revert
```

### Melihat status migrations
```bash
npm run migration:show
```

### Generate migration baru (setelah mengubah entities)
```bash
npm run migration:generate migrations/YourMigrationName
```

### Create migration file kosong
```bash
npm run migration:create migrations/YourMigrationName
```

## Seeder untuk Development

Seeder opsional untuk mengisi data test di development:

```bash
# Di container
docker compose -f ../docker-compose.dev.yml exec api npm run seed:dev

# Atau di local
npm run seed:dev
```

Seeder akan membuat:
- User: test@example.com
- Password: password123
- Profile lengkap dengan data test

## Struktur Migrations

Migrations disimpan di folder `migrations/` dengan format:
```
migrations/
  └── {timestamp}-{MigrationName}.ts
```

Migration pertama: `1700000000000-CreateInitialTables.ts` membuat:
- Table `users`
- Table `user_identities`
- Table `profiles`
- Foreign keys dan constraints

## Troubleshooting

### Migration gagal karena table sudah ada
Jika menggunakan `synchronize: true` di development, table mungkin sudah dibuat otomatis. Nonaktifkan `synchronize` dan gunakan migrations saja.

### Connection error
Pastikan `DATABASE_URL` sudah benar di environment file:
- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

### Migration tidak terdeteksi
Pastikan migration files ada di folder `migrations/` dan sudah di-compile ke `dist/migrations/` setelah build.

