# Nupoo — Notion-like Block Editor

GitHub Pages-ready Next.js block editor with Tiptap, drag & drop blocks, slash commands, nested pages, autosave and local persistence.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Tiptap
- dnd-kit
- lucide-react

## Run

```bash
npm install
npm run dev
```

## Static GitHub Pages build

```bash
npm run build
```

The app uses static export and browser localStorage, so it does not require a Node.js API or PostgreSQL for the GitHub Pages version.

## Deployment

GitHub Actions deploys the `out/` directory to GitHub Pages on pushes to `main`.
