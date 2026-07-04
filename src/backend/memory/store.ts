import type { MemoryRecord, MemoryType } from "./types"

const records = new Map<string, MemoryRecord>()

export function write(record: MemoryRecord): void {
  records.set(record.id, record)
}

export function read(id: string): MemoryRecord | undefined {
  return records.get(id)
}

export function query(type: MemoryType): MemoryRecord[] {
  return Array.from(records.values()).filter((r) => r.type === type)
}

export function remove(id: string): boolean {
  return records.delete(id)
}

export function all(): MemoryRecord[] {
  return Array.from(records.values())
}
