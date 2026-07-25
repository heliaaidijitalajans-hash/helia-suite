/**
 * Shared persistence contract for Helia Cloud collections.
 * File (dev) and Supabase (production) both implement this.
 */

export interface CloudRecordStore<T extends { id: string }> {
  init(): Promise<void>;
  upsert(record: T): Promise<T>;
  patch(id: string, patch: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  query(predicate: (item: T) => boolean): Promise<T[]>;
  /** Drop memory cache and re-read from durable backend. */
  reload(): Promise<void>;
}
