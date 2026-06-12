import type { GenEntry, IncomeEntry, Project } from './roi';

const DB_NAME = 'cashflower';
const DB_VERSION = 1;
const STORES = ['projects', 'gens', 'income'] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        for (const name of STORES) {
          if (!req.result.objectStoreNames.contains(name)) {
            req.result.createObjectStore(name, { keyPath: 'id' });
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const ledgerDb = {
  getProjects: () => tx<Project[]>('projects', 'readonly', (s) => s.getAll() as IDBRequest<Project[]>),
  getGens: () => tx<GenEntry[]>('gens', 'readonly', (s) => s.getAll() as IDBRequest<GenEntry[]>),
  getIncome: () => tx<IncomeEntry[]>('income', 'readonly', (s) => s.getAll() as IDBRequest<IncomeEntry[]>),
  putProject: (p: Project) => tx('projects', 'readwrite', (s) => s.put(p)),
  putGen: (g: GenEntry) => tx('gens', 'readwrite', (s) => s.put(g)),
  putIncome: (i: IncomeEntry) => tx('income', 'readwrite', (s) => s.put(i)),
  deleteIncome: (id: string) => tx('income', 'readwrite', (s) => s.delete(id)),
  async deleteProject(id: string): Promise<void> {
    const [gens, income] = await Promise.all([this.getGens(), this.getIncome()]);
    await tx('projects', 'readwrite', (s) => s.delete(id));
    for (const g of gens.filter((x) => x.projectId === id)) {
      await tx('gens', 'readwrite', (s) => s.delete(g.id));
    }
    for (const i of income.filter((x) => x.projectId === id)) {
      await tx('income', 'readwrite', (s) => s.delete(i.id));
    }
  },
};
