# CI/CD Pipeline

## Overview

Starken OS uses **GitHub Actions** for CI and **Vercel** for deployment.

## CI Pipeline (GitHub Actions)

Runs on every push to `main` and on pull requests targeting `main`.

**Workflow:** `.github/workflows/ci.yml`

| Step   | Command        | Description                                        |
|--------|----------------|----------------------------------------------------|
| Lint   | `npm run lint` | ESLint on `api/` (warnings only, non-blocking)     |
| Test   | `npm test`     | Vitest unit tests in `tests/`                      |

### Running locally

```bash
npm install        # Install dependencies
npm run lint       # Lint API code
npm test           # Run tests
npm run ci         # Lint + test combined
```

## Deployment (Vercel)

- **Production:** Auto-deploys on push to `main` → `starken-os.vercel.app`
- **Preview:** Auto-deploys on PRs → unique preview URL per PR
- **Config:** `vercel.json` (rewrites + function durations)

## Testing

- **Framework:** Vitest
- **Config:** `vitest.config.mjs`
- **Tests:** `tests/` directory
- **Current coverage:** Content API handler routing and validation

### Adding tests

Create `.test.mjs` files in `tests/`. Example:

```js
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

## Linting

- **Tool:** ESLint 10 (flat config)
- **Config:** `eslint.config.mjs`
- **Scope:** `api/` directory (serverless functions)
- **Mode:** `continue-on-error` in CI (pre-existing issues being addressed)

### Known lint issues

- `api/meta/publish.js:253,255` — `imageUrls` undefined (real bug, error-path only)
- 34 warnings (unused variables in catch blocks, etc.)
