import { ledgerDb } from './db';
import {
  perProject,
  summarize,
  uid,
  type GenEntry,
  type IncomeEntry,
  type Project,
  type RoiSummary,
  type ProjectRoi,
} from './roi';
import type { GenKind } from '../costs';

class LedgerStore {
  projects = $state<Project[]>([]);
  gens = $state<GenEntry[]>([]);
  income = $state<IncomeEntry[]>([]);
  loaded = $state(false);

  totals: RoiSummary = $derived(summarize(this.gens, this.income));
  byProject: ProjectRoi[] = $derived(perProject(this.projects, this.gens, this.income));

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      [this.projects, this.gens, this.income] = await Promise.all([
        ledgerDb.getProjects(),
        ledgerDb.getGens(),
        ledgerDb.getIncome(),
      ]);
    } catch {
      /* private mode — ledger works for the session only */
    }
    this.loaded = true;
  }

  async addProject(trackId: string, title: string): Promise<Project> {
    const project: Project = { id: uid(), trackId, title, createdAt: Date.now() };
    this.projects = [...this.projects, project];
    await ledgerDb.putProject(project).catch(() => undefined);
    return project;
  }

  async logGen(projectId: string, kind: GenKind, model: string, label: string, costEst: number): Promise<void> {
    const entry: GenEntry = { id: uid(), projectId, ts: Date.now(), kind, model, label, costEst };
    this.gens = [...this.gens, entry];
    await ledgerDb.putGen(entry).catch(() => undefined);
  }

  async logIncome(projectId: string, amount: number, source: string, note = ''): Promise<void> {
    const entry: IncomeEntry = { id: uid(), projectId, ts: Date.now(), amount, source, note };
    this.income = [...this.income, entry];
    await ledgerDb.putIncome(entry).catch(() => undefined);
  }

  async removeIncome(id: string): Promise<void> {
    this.income = this.income.filter((i) => i.id !== id);
    await ledgerDb.deleteIncome(id).catch(() => undefined);
  }

  async removeProject(id: string): Promise<void> {
    this.projects = this.projects.filter((p) => p.id !== id);
    this.gens = this.gens.filter((g) => g.projectId !== id);
    this.income = this.income.filter((i) => i.projectId !== id);
    await ledgerDb.deleteProject(id).catch(() => undefined);
  }
}

export const ledger = new LedgerStore();
