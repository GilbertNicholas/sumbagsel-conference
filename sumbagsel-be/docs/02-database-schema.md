# Database Schema v1
PostgreSQL with UUID.

## Table users
Purpose
Akun utama dan status autentikasi.

Columns
- id uuid PK default gen_random_uuid()
- email varchar(255) unique not null
- password_hash text null
- is_email_verified boolean not null default false
- status varchar(20) not null default 'active'
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Notes
- password_hash null untuk user yang hanya login lewat Google.

## Table user_identities
Purpose
Menyimpan daftar metode login untuk 1 user.

Columns
- id uuid PK default gen_random_uuid()
- user_id uuid not null FK users(id) on delete cascade
- provider varchar(30) not null
- provider_user_id varchar(255) not null
- created_at timestamptz not null default now()

Constraints
- unique(provider, provider_user_id)
- index(user_id)

Provider values examples
- local
- google

## Table profiles
Purpose
Data profile user yang diisi setelah login.

Columns
- id uuid PK default gen_random_uuid()
- user_id uuid not null FK users(id) on delete cascade unique
- full_name varchar(150) not null
- church_name varchar(150) not null
- contact_email varchar(255) null
- photo_url text null
- is_completed boolean not null default false
- completed_at timestamptz null
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Notes
- contact_email dapat diset default sama dengan users.email saat create profile.

## Future Ready Considerations
- Tambah table churches jika nanti perlu normalisasi.
- Tambah roles jika ada admin region.