# Extera Mensa

A mobile-first cafeteria and shared-ride coordination app.

## Local development

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run verify
```

This command runs strict type checking, linting, formatting checks, unit tests, and the production build.

## Local database

Docker is required for the local Supabase stack.

```bash
npm run db:start
npm run test:db
npm run db:stop
```
