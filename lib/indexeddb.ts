import type { IStorageAdapter } from './storage-adapter'

const DB_NAME = 'nupoo'
const DB_VERSION = 1
const STORE = 'blobs'

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is unavailable'))
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
  })

  return dbPromise
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

export const indexedDbAdapter: IStorageAdapter = {
  async get(key) {
    const db = await openDatabase()
    const value = await requestValue(db.transaction(STORE, 'readonly').objectStore(STORE).get(key))
    return value instanceof Uint8Array ? value : value instanceof ArrayBuffer ? new Uint8Array(value) : null
  },
  async set(key, data) {
    const db = await openDatabase()
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(data, key)
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted'))
    })
  },
  async delete(key) {
    const db = await openDatabase()
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).delete(key)
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB delete aborted'))
    })
  },
  async list(prefix) {
    const db = await openDatabase()
    const keys = await requestValue(db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys())
    return keys.filter((key): key is string => typeof key === 'string' && key.startsWith(prefix))
  },
}
