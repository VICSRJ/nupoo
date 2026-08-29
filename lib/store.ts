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
  undo: () => void
  redo: () => void
  toggleFavorite: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleDark: () => void
  setSearchOpen: (open: boolean) => void
  setQuery: (query: string) => void
  setSaveState: (state: SaveState) => void
}

let lastHistoryAt = 0
let lastHistoryPageId = ''

export const useNupooStore = create<NupooStore>((set, get) => ({
  pages: [], trash: [], activePageId: '', sidebarOpen: true, dark: false, searchOpen: false,
  query: '', saveState: 'idle', hydrated: false, canUndo: false, canRedo: false,

  initialize: (requestedId) => {
    const pages = dataService.load()
    const trash = dataService.loadTrash()
    const activePageId = requestedId && pages.some((page) => page.id === requestedId) ? requestedId : pages[0]?.id || ''
    lastHistoryAt = 0; lastHistoryPageId = ''
    set({ pages, trash, activePageId, hydrated: true, canUndo: false, canRedo: false })
  },

  selectPage: (id) => set({ activePageId: id, searchOpen: false, query: '' }),

  createPage: (parentId = null) => {
    const page = dataService.create(parentId)
    set((state) => ({ pages: [...state.pages, page], activePageId: page.id, canUndo: true, canRedo: false }))
    return page.id
  },

  updatePage: (page) => set((state) => {
    const index = state.pages.findIndex((item) => item.id === page.id)
    if (index < 0) return state
    const now = Date.now()
    const coalesce = lastHistoryPageId === page.id && now - lastHistoryAt < 700
    const past = state.canUndo && coalesce ? historyPast : [...historyPast, state.pages[index]]
    historyPast = past.slice(-80)
    historyFuture = []
    lastHistoryAt = now; lastHistoryPageId = page.id
    return { pages: state.pages.map((item) => item.id === page.id ? page : item), canUndo: true, canRedo: false }
  }),

  deletePage: (id) => set((state) => {
    if (id === 'welcome') return state
    const ids = new Set<string>()
    const walk = (parentId: string) => { ids.add(parentId); state.pages.filter((page) => page.parentId === parentId).forEach((page) => walk(page.id)) }
    walk(id)
    const removed = state.pages.filter((page) => ids.has(page.id))
    if (removed.length === 0) return state
    historyPast = [...historyPast, state.pages].slice(-80); historyFuture = []
    const pages = state.pages.filter((page) => !ids.has(page.id))
    const trash = [...state.trash, ...removed.map((page) => ({ ...page, parentId: null }))]
    const activePageId = ids.has(state.activePageId) ? pages[0]?.id || '' : state.activePageId
    return { pages, trash, activePageId, canUndo: true, canRedo: false }
  }),

  restorePage: (id) => set((state) => {
    const item = state.trash.find((page) => page.id === id)
    if (!item) return state
    historyPast = [...historyPast, state.pages].slice(-80); historyFuture = []
    return { trash: state.trash.filter((page) => page.id !== id), pages: [...state.pages, item], activePageId: item.id, canUndo: true, canRedo: false }
  }),

  permanentlyDeletePage: (id) => set((state) => ({ trash: state.trash.filter((page) => page.id !== id) })),
  emptyTrash: () => set({ trash: [] }),

  undo: () => set((state) => {
    if (!historyPast.length) return state
    const previous = historyPast.pop()!
    historyFuture.push(state.pages)
    return { pages: previous, canUndo: historyPast.length > 0, canRedo: true, activePageId: previous.some((p) => p.id === state.activePageId) ? state.activePageId : previous[0]?.id || '' }
  }),

  redo: () => set((state) => {
    if (!historyFuture.length) return state
    const next = historyFuture.pop()!
    historyPast.push(state.pages)
    return { pages: next, canUndo: true, canRedo: historyFuture.length > 0, activePageId: next.some((p) => p.id === state.activePageId) ? state.activePageId : next[0]?.id || '' }
  }),

  toggleFavorite: (id) => set((state) => {
    const page = state.pages.find((item) => item.id === id)
    if (!page) return state
    historyPast = [...historyPast, state.pages].slice(-80); historyFuture = []
    return { pages: state.pages.map((item) => item.id === id ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item), canUndo: true, canRedo: false }
  }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleDark: () => set((state) => ({ dark: !state.dark })),
  setSearchOpen: (searchOpen) => set({ searchOpen, ...(searchOpen ? {} : { query: '' }) }),
  setQuery: (query) => set({ query }),
  setSaveState: (saveState) => set({ saveState }),
}))

let historyPast: Page[][] = []
let historyFuture: Page[][] = []
