# Frontend - SentinelShield AI

Next.js 14 frontend for the multi-tenant threat detection SaaS platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
cp .env.example .env.local
```

3. Run development server:
```bash
npm run dev
```

Application runs on `http://localhost:3000`

## Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components (Dashboard, Charts, Forms)
- `lib/` - Utility functions and API clients
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `utils/` - Helper functions
- `styles/` - Global CSS and Tailwind configuration

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **UI Components**: Lucide Icons
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Data Fetching**: SWR

## Key Features

- Modern, responsive dashboard
- Real-time threat visualization with attack map
- User authentication and RBAC
- Multi-tenant support
- Dark mode theme
- WebSocket integration for live updates
- Audit trail viewer
- Threat log analysis
