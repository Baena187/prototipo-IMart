/**
 * Camada de persistência da demonstração.
 *
 * Cada coleção nasce de um "seed" determinístico e guarda no localStorage apenas as
 * alterações feitas durante a demonstração (upserts/remoções). Os serviços consomem
 * esta camada de forma assíncrona; para integrar uma API REST basta trocar a
 * implementação dos serviços mantendo as mesmas assinaturas.
 */
import type { Entity } from '@/types';

const PREFIX = 'imart.v1.';

type Listener = (collection: string) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(collection: string) {
  listeners.forEach((l) => l(collection));
}

interface Patch<T> {
  upserts: Record<string, T>;
  added: string[];
  removed: string[];
}

function readPatch<T>(name: string): Patch<T> {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) return JSON.parse(raw) as Patch<T>;
  } catch {
    /* armazenamento indisponível: segue apenas em memória */
  }
  return { upserts: {}, added: [], removed: [] };
}

function writePatch<T>(name: string, patch: Patch<T>) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(patch));
  } catch {
    /* ignora cota/privacidade */
  }
}

export class Collection<T extends Entity> {
  private map: Map<string, T> | null = null;
  private order: string[] = [];
  private patch: Patch<T> = { upserts: {}, added: [], removed: [] };

  constructor(
    readonly name: string,
    private readonly seed: () => T[],
  ) {}

  private ensure(): Map<string, T> {
    if (this.map) return this.map;
    const base = this.seed();
    this.patch = readPatch<T>(this.name);
    const map = new Map<string, T>();
    base.forEach((item) => map.set(item.id, item));
    Object.values(this.patch.upserts).forEach((item) => map.set(item.id, item));
    this.patch.removed.forEach((id) => map.delete(id));
    const baseIds = base.map((b) => b.id).filter((id) => map.has(id));
    const added = this.patch.added.filter((id) => map.has(id) && !baseIds.includes(id));
    this.order = [...added, ...baseIds];
    this.map = map;
    return map;
  }

  all(): T[] {
    const map = this.ensure();
    return this.order.map((id) => map.get(id)!).filter(Boolean);
  }

  get(id: string): T | undefined {
    return this.ensure().get(id);
  }

  upsert(item: T): T {
    const map = this.ensure();
    const isNew = !map.has(item.id);
    map.set(item.id, item);
    if (isNew) {
      this.order.unshift(item.id);
      this.patch.added.unshift(item.id);
    }
    this.patch.upserts[item.id] = item;
    this.patch.removed = this.patch.removed.filter((id) => id !== item.id);
    writePatch(this.name, this.patch);
    emit(this.name);
    return item;
  }

  upsertMany(items: T[]) {
    const map = this.ensure();
    items.forEach((item) => {
      if (!map.has(item.id)) {
        this.order.unshift(item.id);
        this.patch.added.unshift(item.id);
      }
      map.set(item.id, item);
      this.patch.upserts[item.id] = item;
    });
    writePatch(this.name, this.patch);
    emit(this.name);
  }

  update(id: string, changes: Partial<T>): T | undefined {
    const current = this.get(id);
    if (!current) return undefined;
    return this.upsert({ ...current, ...changes });
  }

  remove(id: string) {
    const map = this.ensure();
    map.delete(id);
    this.order = this.order.filter((o) => o !== id);
    delete this.patch.upserts[id];
    this.patch.added = this.patch.added.filter((o) => o !== id);
    this.patch.removed.push(id);
    writePatch(this.name, this.patch);
    emit(this.name);
  }
}

/** Documento único (ex.: configurações). */
export class SingleDoc<T extends object> {
  private value: T | null = null;
  constructor(
    readonly name: string,
    private readonly seed: () => T,
  ) {}

  get(): T {
    if (this.value) return this.value;
    let stored: Partial<T> = {};
    try {
      const raw = localStorage.getItem(PREFIX + this.name);
      if (raw) stored = JSON.parse(raw);
    } catch {
      /* noop */
    }
    this.value = { ...this.seed(), ...stored };
    return this.value;
  }

  set(changes: Partial<T>): T {
    this.value = { ...this.get(), ...changes };
    try {
      localStorage.setItem(PREFIX + this.name, JSON.stringify(this.value));
    } catch {
      /* noop */
    }
    emit(this.name);
    return this.value;
  }
}

export function resetDemoData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

/** Simula latência de rede para exercitar estados de carregamento. */
export function delay<T>(value: T, ms = 280): Promise<T> {
  const jitter = Math.round(Math.random() * 120);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms + jitter));
}
