import { roundPollen } from '../costs';

export interface Project {
  id: string;
  trackId: string;
  title: string;
  createdAt: number;
}

export interface GenEntry {
  id: string;
  projectId: string;
  ts: number;
  kind: 'image' | 'text' | 'audio';
  model: string;
  label: string;
  costEst: number;
}

export interface IncomeEntry {
  id: string;
  projectId: string;
  ts: number;
  amount: number;
  source: string;
  note: string;
}

export interface RoiSummary {
  spent: number; // pollen ≈ USD
  earned: number; // USD
  net: number;
  multiplier: number | null; // null until something is spent
}

export function summarize(gens: GenEntry[], income: IncomeEntry[]): RoiSummary {
  const spent = roundPollen(gens.reduce((s, g) => s + g.costEst, 0));
  const earned = Math.round(income.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  return {
    spent,
    earned,
    net: Math.round((earned - spent) * 100) / 100,
    multiplier: spent > 0 ? Math.round((earned / spent) * 10) / 10 : null,
  };
}

export interface ProjectRoi extends RoiSummary {
  project: Project;
  genCount: number;
}

export function perProject(projects: Project[], gens: GenEntry[], income: IncomeEntry[]): ProjectRoi[] {
  return projects
    .map((project) => {
      const g = gens.filter((x) => x.projectId === project.id);
      const i = income.filter((x) => x.projectId === project.id);
      return { project, genCount: g.length, ...summarize(g, i) };
    })
    .sort((a, b) => b.project.createdAt - a.project.createdAt);
}

/**
 * Petal count for the ROI flower: a flower with 12 petals that fills on a
 * log scale — break-even (1×) opens the first petal, 10× opens half,
 * 1000× and beyond is full bloom.
 */
export function bloomPetals(multiplier: number | null, total = 12): number {
  if (multiplier === null || multiplier < 1) return 0;
  const filled = Math.floor((Math.log10(multiplier) / 3) * (total - 1)) + 1;
  return Math.max(1, Math.min(total, filled));
}

export function uid(): string {
  return crypto.randomUUID();
}
