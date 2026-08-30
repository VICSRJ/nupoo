export interface IStorageAdapter {
  get(key: string): Promise<Uint8Array | null>
  set(key: string, data: Uint8Array): Promise<void>
  delete(key: string): Promise<void>
  list(prefix: string): Promise<string[]>
}
