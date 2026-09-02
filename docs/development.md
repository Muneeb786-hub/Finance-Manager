# Local Development Guide

## Prerequisites
- Node.js 18+ or 20+
- npm 9+
- Docker or a local PostgreSQL instance

## Quick Start

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repository-url>
   cd Finance-Manager
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL Database**:
   If using Docker:
   ```bash
   docker compose up -d
   ```

4. **Initialize Database Schema & Seed Data**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Run Test Suites**:
   ```bash
   npm test
   ```
