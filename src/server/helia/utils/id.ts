import { nanoid } from 'nanoid';

/** Create a prefixed, URL-safe unique identifier. */
export function createId(prefix?: string): string {
  const id = nanoid(16);
  return prefix ? `${prefix}_${id}` : id;
}
