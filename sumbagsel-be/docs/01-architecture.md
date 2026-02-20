# Architecture v1

## Tech Stack
Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod

Backend
- NestJS
- TypeORM
- Passport
- JWT
- Google OAuth 2.0

Database
- MySQL

Infra Local Dev
- Docker
- Docker Compose

## High Level Modules

Backend modules
- AuthModule
  - Local login signup
  - Google OAuth
  - JWT issue
- UsersModule
  - Query user basic data
- ProfilesModule
  - Create update get profile
  - Mark profile completed
- FilesModule minimal
  - Placeholder untuk upload foto jika dibutuhkan

Frontend routes
- /auth/login
- /auth/signup
- /auth/google optional button on login page
- /profile/setup
- /profile/me
- /dashboard

## Redirect Logic
Setelah login sukses:
Frontend call GET /profiles/me
- Jika 404 atau isCompleted false
  redirect ke /profile/setup
- Jika isCompleted true
  redirect ke /dashboard

Alternatif
Backend mengembalikan flags di response login
- profileExists
- profileCompleted
Frontend gunakan flags untuk redirect.

## Data Ownership
- users is authentication identity.
- profiles is community identity.
- user_identities is login providers registry per user.

## Maintainability Principles
- Feature based modules.
- DTO validation di NestJS.
- Zod validation di Next.js.
- Use config module for env.
- Migration based schema changes.
- Terdapat 3 mode: prod, staging, dev