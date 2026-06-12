import { describe, expect, it } from 'vitest';
import { bloomPetals, perProject, summarize, type GenEntry, type IncomeEntry, type Project } from './roi';

const gen = (projectId: string, costEst: number): GenEntry => ({
  id: Math.random().toString(36),
  projectId,
  ts: 1,
  kind: 'image',
  model: 'flux',
  label: 'x',
  costEst,
});

const inc = (projectId: string, amount: number): IncomeEntry => ({
  id: Math.random().toString(36),
  projectId,
  ts: 1,
  amount,
  source: 'etsy',
  note: '',
});

describe('summarize', () => {
  it('computes spend, earnings, net and multiplier', () => {
    const s = summarize([gen('a', 0.008), gen('a', 0.001)], [inc('a', 9)]);
    expect(s.spent).toBe(0.009);
    expect(s.earned).toBe(9);
    expect(s.net).toBe(8.99);
    expect(s.multiplier).toBe(1000);
  });

  it('returns null multiplier when nothing is spent', () => {
    expect(summarize([], [inc('a', 5)]).multiplier).toBeNull();
  });
});

describe('perProject', () => {
  it('groups by project and sorts newest first', () => {
    const projects: Project[] = [
      { id: 'a', trackId: 't', title: 'A', createdAt: 1 },
      { id: 'b', trackId: 't', title: 'B', createdAt: 2 },
    ];
    const rows = perProject(projects, [gen('a', 0.01), gen('b', 0.02)], [inc('b', 4)]);
    expect(rows[0].project.id).toBe('b');
    expect(rows[0].earned).toBe(4);
    expect(rows[1].spent).toBe(0.01);
    expect(rows[0].genCount).toBe(1);
  });
});

describe('bloomPetals', () => {
  it('stays closed below break-even', () => {
    expect(bloomPetals(null)).toBe(0);
    expect(bloomPetals(0.5)).toBe(0);
  });

  it('opens the first petal at break-even and fills on a log scale', () => {
    expect(bloomPetals(1)).toBe(1);
    expect(bloomPetals(10)).toBeGreaterThanOrEqual(4);
    expect(bloomPetals(10)).toBeLessThan(12);
    expect(bloomPetals(1000)).toBe(12);
    expect(bloomPetals(50_000)).toBe(12);
  });
});
