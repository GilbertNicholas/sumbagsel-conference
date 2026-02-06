# SumBagSel Frontend

Next.js frontend untuk sistem pendaftaran konferensi.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19 + Tailwind CSS 4
- **Form**: React Hook Form + Zod
- **State**: React Hooks

## Quick Start

### Dengan Docker

```bash
# Dari root project
docker compose -f docker-compose.dev.yml up
```

Frontend akan berjalan di http://localhost:3001

### Manual Setup

```bash
# Install dependencies
npm install

# Setup environment
cp env.example .env.local
# Edit .env.local

# Start development server
npm run dev
```

Frontend akan berjalan di http://localhost:3001

## Environment Variables

Lihat `env.example` untuk template.

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (tanpa /api) | ✅ |

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

## Project Structure

```
sumbagsel-fe/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── register/          # Registration page
│   ├── schedule/          # Arrival schedule page
│   ├── profile/           # Profile pages
│   └── admin/             # Admin pages
├── components/             # React components
│   ├── sidebar.tsx        # Sidebar navigation
│   └── dashboard-layout.tsx # Layout wrapper
├── lib/                    # Utilities
│   ├── api-client.ts      # API client
│   └── auth-guard.tsx     # Auth guard
└── public/                # Static assets
```

## Features

- User authentication (Email/Password & Google OAuth)
- Profile management
- Event registration
- Arrival schedule management
- Admin dashboard
- Responsive design
