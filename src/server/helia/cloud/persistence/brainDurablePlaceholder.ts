/**
 * Placeholder stores for CloudDatabase brain slots when the durable Supabase
 * backend is active. Runtime chat MUST use SupabaseBrainChatStore
 * (helia_brain_conversations / helia_brain_messages) — never these slots.
 */

import type { CloudRecordStore } from "./recordStore";

export class BrainDurablePlaceholderStore<T extends { id: string }>
  implements CloudRecordStore<T>
{
  private fail(): never {
    throw new Error(
      "Brain chat persistence uses helia_brain_conversations / helia_brain_messages only (SupabaseBrainChatStore). Metadata / CloudDatabase brain slots are not a runtime source of truth."
    );
  }

  async init(): Promise<void> {
    // no-op — CloudDatabase.init() awaits all collections
  }

  async upsert(_record: T): Promise<T> {
    return this.fail();
  }

  async patch(_id: string, _patch: Partial<T>): Promise<T | undefined> {
    return this.fail();
  }

  async delete(_id: string): Promise<boolean> {
    return this.fail();
  }

  async findById(_id: string): Promise<T | undefined> {
    return this.fail();
  }

  async findAll(): Promise<T[]> {
    return this.fail();
  }

  async query(_predicate: (item: T) => boolean): Promise<T[]> {
    return this.fail();
  }

  async reload(): Promise<void> {
    // no-op
  }
}
