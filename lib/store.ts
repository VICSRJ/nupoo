'use client'

import { create } from 'zustand'
import { dataService } from './data-service'
import type { Page } from './storage'

type SaveState = 'idle' | 'saving' | 'saved'
type NupooStore = {
  pages: Page[]
  trash: Page[]
  activePageId: string
  sidebarOpen: boolean
  focusMode: boolean
  dark: boolean
  searchOpen: boolean
  query: string
  saveState: SaveState
  hydrated: boolean
  canUndo: boolean
  canRedo: boolean
  initialize: (requestedId?: string) => void
  selectPage: (id: string) => void
  createPage: (parentId?: string | null) => string
  updatePage: (page: Page) => void
  deletePage: (id: string) => void
  restorePage: (id: string) => void
  permanentlyDeletePage: (id: string) => void
  emptyTrash: () => void
  replaceWorkspace: (pages: Page[], trash: Page[], activePageId?: string) => void
  undo: () => void
  redo: () => void
  toggleFavorite: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleFocusMode: () => void
  toggleDark: () => void
  setSearchOpen: (open: boolean) => void
  setQuery: (query: string) => void
  setSaveState: (state: SaveState) => void
}

let historyPast: Page[][] = []
let historyFuture: Page[][] = []
let lastHistoryAt = 0
let lastHistoryPageId = ''
const snapshot = (pages: Page[]) => pages.map((page) => ({ ...page, blocks: page.blocks.map((block) => ({ ...block, content: block.content ? structuredClone(block.content) : undefined })) }))

export const useNupooStore = create<NupooStore>((set, get) => ({
  pages: [], trash: [], activePageId: '', sidebarOpen: true, focusMode: false, dark: false, searchOpen: false, query: '', saveState: 'idle', hydrated: false, canUndo: false, canRedo: false,
  initialize: (requestedId) => {
    const pages = dataService.load()
    const trash = dataService.loadTrash()
    const persistedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('nupoo.theme') : null
    const activePageId = requestedId && pages.some((page) => page.id === requestedId) ? requestedId : pages[0]?.id || ''
    historyPast = []; historyFuture = []; lastHistoryAt = 0; lastHistoryPageId = ''
    set({ pages, trash, activePageId, dark: persistedTheme === 'dark', hydrated: true, canUndo: false, canRedo: false })
  },
  selectPage: (id) => set((state) => ({ activePageId: id, pages: state.pages.map((page) => page.id === id ? { ...page, lastOpenedAt: new Date().toISOString() } : page), searchOpen: false, query: '' })),
  createPage: (parentId = null) => { const page = dataService.create(parentId); historyPast = [...historyPast, snapshot(get().pages)].slice(-80); historyFuture = []; set((state) => ({ pages: [...state.pages, page], activePageId: page.id, canUndo: true, canRedo: false })); return page.id },
  updatePage: (page) => set((state) => { const index = state.pages.findIndex((item) => item.id === page.id); if (index < 0) return state; const now = Date.now(); const coalesce = lastHistoryPageId === page.id && now - lastHistoryAt < 700; if (!coalesce) historyPast = [...historyPast, snapshot(state.pages)].slice(-80); historyFuture = []; lastHistoryAt = now; lastHistoryPageId = page.id; return { pages: state.pages.map((item) => item.id === page.id ? page : item), canUndo: true, canRedo: false } }),
  deletePage: (id) => set((state) => {
    if (id === 'welcome') return state
    const ids = new Set<string>(); const walk = (parentId: string) => { ids.add(parentId); state.pages.filter((page) => page.parentId === parentId).forEach((page) => walk(page.id)) }
    walk(id); const removed = state.pages.filter((page) => ids.has(page.id)); if (!removed.length) return state
    historyPast = [...historyPast, snapshot(state.pages)].slice(-80); historyFuture = []
    const timestamp = new Date().toISOString(); const pages = state.pages.filter((page) => !ids.has(page.id)); const trash = [...state.trash, ...removed.map((page) => ({ ...page, trashedAt: timestamp }))]
    return { pages, trash, activePageId: ids.has(state.activePageId) ? pages[0]?.id || '' : state.activePageId, canUndo: true, canRedo: false }
  }),
  restorePage: (id) => set((state) => {
    const root = state.trash.find((page) => page.id === id); if (!root) return state
    const subtreeIds = new Set<string>([id]); let changed = true
    while (changed) { changed = false; state.trash.forEach((page) => { if (page.parentId && subtreeIds.has(page.parentId) && !subtreeIds.has(page.id)) { subtreeIds.add(page.id); changed = true } }) }
    const restoring = state.trash.filter((page) => subtreeIds.has(page.id)).map((page) => ({ ...page, trashedAt: null, parentId: page.parentId && (state.pages.some((item) => item.id === page.parentId) || subtreeIds.has(page.parentId)) ? page.parentId : null }))
    historyPast = [...historyPast, snapshot(state.pages)].slice(-80); historyFuture = []
    return { trash: state.trash.filter((page) => !subtreeIds.has(page.id)), pages: [...state.pages, ...restoring], activePageId: root.id, canUndo: true, canRedo: false }
  }),
  permanentlyDeletePage: (id) => set((state) => ({ trash: state.trash.filter((page) => page.id !== id) })),
  emptyTrash: () => set({ trash: [] }),
  replaceWorkspace: (pages, trash, activePageId) => { historyPast = []; historyFuture = []; set({ pages, trash, activePageId: activePageId || pages[0]?.id || '', canUndo: false, canRedo: false }) },
  undo: () => set((state) => { const previous = historyPast.pop(); if (!previous) return state; historyFuture.push(snapshot(state.pages)); return { pages: previous, canUndo: historyPast.length > 0, canRedo: true, activePageId: previous.some((p) => p.id === state.activePageId) ? state.activePageId : previous[0]?.id || '' } }),
  redo: () => set((state) => { const next = historyFuture.pop(); if (!next) return state; historyPast.push(snapshot(state.pages)); return { pages: next, canUndo: true, canRedo: historyFuture.length > 0, activePageId: next.some((p) => p.id === state.activePageId) ? state.activePageId : next[0]?.id || '' } }),
  toggleFavorite: (id) => set((state) => { const page = state.pages.find((item) => item.id === id); if (!page) return state; historyPast = [...historyPast, snapshot(state.pages)].slice(-80); historyFuture = []; return { pages: state.pages.map((item) => item.id === id ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item), canUndo: true, canRedo: false } }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  toggleDark: () => set((state) => ({ dark: !state.dark })),
  setSearchOpen: (searchOpen) => set({ searchOpen, ...(searchOpen ? {} : { query: '' }) }),
  setQuery: (query) => set({ query }),
  setSaveState: (saveState) => set({ saveState }),
}))
