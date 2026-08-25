# AIOps Sustainability Hackathon

A client-only Next.js app (App Router) harness. It ships no server actions, no
API routes, and makes zero network requests after the first page load.

## Requirements

- Node.js and [pnpm](https://pnpm.io)
- Next.js 16 (App Router), React 19
- TypeScript with `strict` and `noUncheckedIndexedAccess`
- Vitest + Testing Library (80% coverage threshold, enforced in CI)

## Scripts

| Command             | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Start the development server at http://localhost:3000    |
| `pnpm test`         | Run the unit test suite once                             |
| `pnpm test:coverage`| Run tests and assert the 80% line coverage threshold     |
| `pnpm build`        | Create a production build (fails on any TS error)        |
| `pnpm lint`         | Lint with ESLint (`no-explicit-any` is an error)         |
| `pnpm format`       | Format the codebase with Prettier                        |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see
the result.

## Project structure

- `app/(site)/page.tsx` — the single client-only route (static).
- `__tests__/` — unit tests for app components.

## Token reduction tools

- [headroom](https://github.com/headroomlabs-ai/headroom)
- [caveman](https://github.com/juliusbrussee/caveman)