# Nupoo

A lightweight Notion-like block editor designed to run directly on GitHub Pages.

## Features

- Tiptap block editor
- Stable block IDs
- Drag-and-drop block reordering
- Add, duplicate and delete blocks
- Heading, paragraph, list, quote and code blocks
- Page sidebar
- Nested page creation
- Autosave to browser localStorage
- Dark mode
- Responsive desktop/mobile UI
- Hash-based navigation so GitHub Pages does not need server routes

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Tiptap · dnd-kit · Lucide

## Local

```bash
npm install
npm run dev
```

## Production / GitHub Pages

```bash
npm install
npm run build
```

The repository includes `.github/workflows/pages.yml`. On a push to `main`, GitHub Actions builds the static `out/` directory and deploys it to GitHub Pages.

Expected site URL:

`https://vicsrj.github.io/nupoo/`

In GitHub repository settings, set **Pages → Source** to **GitHub Actions**.

## Data model

This GitHub Pages edition intentionally uses browser localStorage instead of Prisma/PostgreSQL. That keeps the application fully static and deployable on GitHub Pages. A server-backed edition can be added later without changing the editor UI architecture.
