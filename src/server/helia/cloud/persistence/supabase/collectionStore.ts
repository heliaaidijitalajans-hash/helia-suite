/**
 * Durable Supabase-backed collection store.
 * Same CloudRecordStore contract as CloudDocumentStore — one source of truth
 * for register/login when HELIA_CLOUD_STORE=supabase / production.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudRecordStore } from "../recordStore";

type Row = {
  id: string;
  payload: Record<string, unknown>;
};

export class SupabaseCollectionStore<T extends { id: string }>
  implements CloudRecordStore<T>
{
  private data: T[] = [];
  private loaded = false;
  private opQueue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly sb: SupabaseClient,
    private readonly table: string,
    private readonly maxRecords = 100_000
  ) {}

  private enqueue<R>(fn: () => Promise<R>): Promise<R> {
    const run = this.opQueue.then(fn, fn);
    this.opQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  async init(): Promise<void> {
    return this.enqueue(async () => {
      if (this.loaded) return;
      await this.loadFromRemote();
    });
  }

  private async loadFromRemote(): Promise<void> {
    const { data, error } = await this.sb
      .from(this.table)
      .select("id, payload");
    if (error) throw error;
    this.data = ((data as Row[] | null) || []).map((row) => {
      const payload = row.payload as T;
      return { ...payload, id: row.id };
    });
    this.loaded = true;
  }

  private async writeRow(record: T): Promise<void> {
    const { error } = await this.sb.from(this.table).upsert(
      {
        id: record.id,
        payload: record,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  private async deleteRow(id: string): Promise<void> {
    const { error } = await this.sb.from(this.table).delete().eq("id", id);
    if (error) throw error;
  }

  async upsert(record: T): Promise<T> {
    return this.enqueue(async () => {
      if (!this.loaded) await this.loadFromRemote();
      // Durable write first — then memory (never the reverse).
      await this.writeRow(record);
      const index = this.data.findIndex((item) => item.id === record.id);
      if (index >= 0) this.data[index] = record;
      else {
        this.data.push(record);
        if (this.data.length > this.maxRecords) {
          this.data = this.data.slice(this.data.length - this.maxRecords);
        }
      }
      return record;
    });
  }

  async patch(id: string, patch: Partial<T>): Promise<T | undefined> {
    return this.enqueue(async () => {
      if (!this.loaded) await this.loadFromRemote();
      const index = this.data.findIndex((item) => item.id === id);
      const current = index >= 0 ? this.data[index] : undefined;
      if (!current) return undefined;
      const next = { ...current, ...patch, id: current.id };
      await this.writeRow(next);
      this.data[index] = next;
      return next;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.enqueue(async () => {
      if (!this.loaded) await this.loadFromRemote();
      const before = this.data.length;
      const next = this.data.filter((item) => item.id !== id);
      if (next.length === before) return false;
      await this.deleteRow(id);
      this.data = next;
      return true;
    });
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

  async reload(): Promise<void> {
    return this.enqueue(async () => {
      this.loaded = false;
      this.data = [];
      await this.loadFromRemote();
    });
  }
}
