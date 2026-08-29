'use client'

import { create } from 'zustand'
import { dataService } from './data-service'
import type { Page } from './storage'

type SaveState = 'idle' | 'saving' | 'saved'

type NupooStore = {
  pages: Page[]
  activePageId: string
  sidebarOpen: boolean
  dark: boolean
  searchOpen: boolean
  query: string
  saveState: SaveState
  hydrated: boolean
  initialize: (requestedId?: string) => void
  selectPage: (id: string) => void
  createPage: (parentId?: string | null) => string
  updatePage: (page: Page) => void
  deletePage: (id: string) => void
  toggleFavorite: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleDark: () => void
  setSearchOpen: (open: boolean) => void
  setQuery: (query: string) => void
  setSaveState: (state: SaveState) => void
}

export const useNupooStore = create<NupooStore>((set, get) => ({
  pages: [],
  activePageId: '',
  sidebarOpen: true,
  dark: false,
  searchOpen: false,
  query: '',
  saveState: 'idle',
  hydrated: false,
  initialize: (requestedId) => {
    const pages = dataService.load()
    const activePageId = requestedId && pages.some((page) => page.id === requestedId) ? requestedId : pages[0]?.id || ''
    set({ pages, activePageId, hydrated: true })
  },
  selectPage: (id) => set({ activePageId: id, searchOpen: false, query: '' }),
  createPage: (parentId = null) => {
    const page = dataService.create(parentId)
    set((state) => ({ pages: [...state.pages, page], activePageId: page.id }))
    return page.id
  },
  updatePage: (page) => set((state) => ({ pages: state.pages.map((item) => (item.id === page.id ? page : item)) })),
  deletePage: (id) => {
    const { pages, activePageId } = get()
    const idsToDelete = new Set<string>()
    const walk = (parentId: string) => {
      idsToDelete.add(parentId)
      pages.filter((page) => page.parentId === parentId).forEach((page) => walk(page.id))
    }
    walk(id)
    const nextPages = pages.filter((page) => !idsToDelete.has(page.id))
    const nextActive = activePageId === id || idsToDelete.has(activePageId) ? nextPages[0]?.id || '' : activePageId
    set({ pages: nextPages, activePageId: nextActive })
  },
  toggleFavorite: (id) => set((state) => ({ pages: state.pages.map((page) => page.id === id ? { ...page, favorite: !page.favorite, updatedAt: new Date().toISOString() } : page) })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleDark: () => set((state) => ({ dark: !state.dark })),
  setSearchOpen: (searchOpen) => set({ searchOpen, ...(searchOpen ? {} : { query: '' }) }),
  setQuery: (query) => set({ query }),
  setSaveState: (saveState) => set({ saveState }),
}))
