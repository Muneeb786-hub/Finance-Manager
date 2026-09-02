# Personal Finance Manager

A modern, responsive, and secure personal finance web application built for student portfolio presentation. Personal Finance Manager empowers users to track income and expenses, organize category budgets, achieve savings goals, automate recurring transactions, and explore educational financial insights with complete privacy.

---

## Important Educational Disclaimer

> **Notice:** Financial Insights are provided for general educational and organizational purposes only. They are not financial, investment, tax, legal, or professional advice. This application does not connect to real banks and does not make investment recommendations, loan suggestions, or regulated financial guidance.

---

## Core Features

- **Private & Self-Directed**: No third-party bank connections. All data is user-entered and strictly isolated to your authenticated account.
- **Transaction Management**: Record income and expenses with categories, payment methods, accounts, and tags. Fast searching, multi-criteria filtering, multi-column sorting, and CSV export.
- **Monthly Category Budgets**: Configure spending limits per category with proactive alert thresholds (e.g. 80%) and clear status indicators (On track, Approaching limit, Over budget).
- **Savings Goals**: Set target dates and amounts, track contributions and withdrawals, calculate required monthly savings, and celebrate milestones.
- **Recurring Transactions Engine**: Create recurring templates across daily, weekly, monthly, and yearly frequencies with server-side processing and duplicate prevention.
- **Visual Analytics**: Interactive Recharts dashboards showing spending distributions, income vs. expense cash flows, and budget performance.
- **Financial Insights**: Server-side analysis of your app-recorded data providing neutral, educational observations and organizational suggestions.
- **Modern UI & Accessibility**: Responsive desktop sidebar, mobile navigation, dark/light themes, skeleton loaders, and keyboard-friendly dialogs.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI primitives, Lucide Icons, Sonner toasts
- **Charts**: Recharts
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: Auth.js / NextAuth (Credentials provider with bcrypt password hashing)
- **Form Handling & Validation**: React Hook Form, Zod
- **Safe Money Math**: `decimal.js` for arbitrary-precision financial calculations
- **Testing**: Vitest for unit/integration tests, Playwright for end-to-end testing

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- Docker or a local PostgreSQL instance

### 2. Installation
```bash
git clone <repository-url>
cd Finance-Manager
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your connection strings:
```bash
cp .env.example .env
```

### 4. Database Setup
Start a PostgreSQL container:
```bash
docker compose up -d
```

Push the Prisma schema to the database:
```bash
npx prisma db push
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Testing

Run unit and integration test suites:
```bash
npm test
```

---

## Project Structure

```
Finance-Manager/
├── docs/                      # Architecture, security, API, and database docs
├── prisma/
│   ├── schema.prisma          # PostgreSQL relational schema
│   └── seed.ts                # Database seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & registration pages
│   │   ├── (dashboard)/       # Authenticated dashboard views
│   │   ├── api/               # Server route handlers
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Public landing page
│   ├── components/
│   │   ├── layout/            # Navbar, sidebar, theme toggle
│   │   ├── ui/                # Button, card, dialog, badge components
│   │   └── ...                # Feature-specific components
│   ├── lib/                   # Auth, db, decimal, validations, and insights logic
│   └── types/                 # TypeScript definitions
├── docker-compose.yml         # Local database service
└── package.json
```

---

## License
Distributed under the MIT License.
