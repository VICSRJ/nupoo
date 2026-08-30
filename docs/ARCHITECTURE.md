# Nupoo architecture

## Runtime

```text
React UI
  ↓
Zustand workspace state
  ↓
Data Service
  ↓
Storage adapter
  ↓
localStorage (current) → IndexedDB/API (future)
```

The editor uses Tiptap JSON as the canonical rich-content representation. Block metadata remains in the page model for navigation, ordering, favorites and trash state.

## Editor pipeline

```text
Keyboard / pointer
      ↓
Tiptap commands
      ↓
Block JSON
      ↓
Workspace store
      ↓
Debounced persistence
```

`dnd-kit` is retained for accessible drag interactions. Framer Motion is used for lightweight layout and micro-interaction animation; the two libraries solve different problems and are intentionally not duplicated.

## Storage evolution

The current static deployment uses browser storage. The data-service boundary keeps the UI independent from the storage implementation, allowing a future IndexedDB adapter or remote API without rewriting editor components.

## Design principles

- local-first and resilient
- keyboard-first interaction
- rich text without unnecessary UI chrome
- short, interruptible animations
- no animation that blocks editing
- reduced-motion support
- accessible labels and visible focus
- static-export compatible code path
