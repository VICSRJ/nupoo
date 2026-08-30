# Contributing to Nupoo

## Development

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run type-check
npm run lint
npm run test
npm run format:check
npm run build
```

## Architecture rules

- UI komponenty nevolají `localStorage` přímo.
- Datové operace vedou přes `lib/data-service.ts`.
- Editor content je primárně Tiptap JSON.
- `Block.text` slouží jako textový fallback/search representation.
- Nové block typy musí projít storage normalizací a mít unit test.
- Animace mají být krátké, účelové a respektovat `prefers-reduced-motion`.
- Zachovávat dostupné názvy tlačítek a viditelný focus.

## Commits

Používej Conventional Commits, například:

```text
feat: add table block
fix: align selection toolbar
refactor: isolate storage adapter
style: refine editor surfaces
chore: update dependencies
```

## Pull requests

PR má obsahovat:

- stručný popis změny
- důvod změny
- případné UX důsledky
- výsledek type-check/lint/test/build
- screenshot pro významné vizuální změny

## Branches

Preferované názvy:

```text
feat/...
fix/...
refactor/...
chore/...
```

`main` musí zůstat deployable.
