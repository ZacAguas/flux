# Contributing to Flux

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- Chrome 113+ or Edge 113+ (WebGPU required for local testing)

## Development Setup

```bash
pnpm install
pnpm dev        # starts Vite dev server at http://localhost:5173
pnpm build      # production build (must pass before opening a PR)
pnpm lint       # ESLint check
```

## Code Style

- **TypeScript strict mode** — no `as any` without a comment explaining why (incomplete library types are the only accepted reason)
- **React functional components** only — no class components
- **Tailwind CSS** for styling — no inline styles or CSS modules
- **Zustand slices** for state — add new state to the appropriate slice in `src/store/slices/`
- No comments explaining *what* code does — only *why* for non-obvious constraints or workarounds

## Commit Convention

```
feat:  new user-visible feature
fix:   bug fix
chore: tooling, deps, config
docs:  documentation only
```

One subject line, no period at the end. Keep it under 72 characters.

## Pull Request Checklist

- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] `pnpm lint` is clean
- [ ] No new `as any` casts without a justifying comment
- [ ] Tested in Chrome 113+ with a real `.nii` or `.nii.gz` file
- [ ] Describe *why* the change is needed, not just what changed

## Project Structure

```
src/
├── components/    # React components (UI and 3D)
├── hooks/         # Custom React hooks
├── shaders/       # Three.js TSL shader materials
├── store/         # Zustand state (slices + types)
├── types/         # TypeScript interfaces
└── utils/         # Pure utility functions
```

See `docs/` for architecture deep-dives on raymarching, slice extraction, session management, and more.

## Reporting Bugs

Open a GitHub issue with:
1. Browser and version
2. Steps to reproduce
3. Whether the file is 3D or 4D, and approximate size
