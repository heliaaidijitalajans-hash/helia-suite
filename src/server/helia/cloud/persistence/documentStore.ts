/**
 * Cloud document store — atomic JSON persistence with delete support.
 * Independent of Helia Core Database module.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class CloudDocumentStore<T extends { id: string }> {
  private data: T[] = [];
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly maxRecords = 100_000,
  ) {}

  async init(): Promise<void> {
    if (this.loaded) return;
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) this.data = parsed as T[];
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw error;
      this.data = [];
      await this.persist();
    }
    this.loaded = true;
  }

  async upsert(record: T): Promise<T> {
    await this.init();
    const index = this.data.findIndex((item) => item.id === record.id);
    if (index >= 0) this.data[index] = record;
    else {
      this.data.push(record);
      if (this.data.length > this.maxRecords) {
        this.data = this.data.slice(this.data.length - this.maxRecords);
      }
    }
    await this.persist();
    return record;
  }

  async patch(id: string, patch: Partial<T>): Promise<T | undefined> {
    await this.init();
    const index = this.data.findIndex((item) => item.id === id);
    const current = index >= 0 ? this.data[index] : undefined;
    if (!current) return undefined;
    const next = { ...current, ...patch, id: current.id };
    this.data[index] = next;
    await this.persist();
    return next;
  }

  async delete(id: string): Promise<boolean> {
    await this.init();
    const before = this.data.length;
    this.data = this.data.filter((item) => item.id !== id);
    if (this.data.length === before) return false;
    await this.persist();
    return true;
  }

  async findById(id: string): Promise<T | undefined> {
    await this.init();
    return this.data.find((item) => item.id === id);
  }

  async findAll(): Promise<T[]> {
    await this.init();
    return [...this.data];
  }

  async query(predicate: (item: T) => boolean): Promise<T[]> {
    await this.init();
    return this.data.filter(predicate);
  }

  private async persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const tmp = `${this.filePath}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(this.data, null, 0), 'utf8');
      await rename(tmp, this.filePath);
    });
    await this.writeQueue;
  }
}
