# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Branch Naming Convention

This document defines the standard naming format for Git branches to ensure clarity, consistency, and easier collaboration.

### Standard Format

`<type>/<short-description>`

- Use lowercase letters
- Separate words with hyphens
- Keep descriptions short and meaningful

### Allowed Branch Types

- `feature/` – new features
- `fix/` or `bugfix/` – bug fixes
- `hotfix/` – urgent production fixes
- `chore/` – maintenance, tooling, cleanup
- `docs/` – documentation updates
- `test/` – tests only
- `refactor/` – code restructuring (no behavior change)
- `release/` – release preparation

### With Ticket / Task ID (Recommended)

`<type>/<ticket-id>-<short-description>`

**Examples:**
- `feature/WEB-124-sanity-integration`
- `fix/BUG-77-contact-form`
- `chore/DEV-9-eslint-update`

### Examples

**Good:**
- `feature/sanity-dynamic-content`
- `fix/contact-form-validation`
- `docs/cms-dynamic-scope`

**Avoid:**
- `testing123`
- `new-feature`
- `yaw-branch`
- `cms`

### Rule of Thumb

A branch name should clearly explain its purpose without opening the code or PR.
