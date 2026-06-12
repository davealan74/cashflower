import type { CostTable, GenKind } from '../costs';
import { estimateCost, roundPollen } from '../costs';

export interface TrackInput {
  id: string;
  label: string;
  kind: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
  default?: string;
  required?: boolean;
  help?: string;
}

export interface GenJob {
  id: string;
  label: string;
  kind: GenKind;
  model: string;
  /** Builds the prompt; receives text results of earlier jobs keyed by job id. */
  prompt: (results: Record<string, string>) => string;
  width?: number;
  height?: number;
  voice?: string;
  filename: string;
}

export interface EarningsMath {
  priceLow: number;
  priceHigh: number;
  effortMins: number;
  market: string;
  firstSale: string[];
}

export interface Track {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** Short ledger-style code stamped on the track card, e.g. "No. 01". */
  no: string;
  earnings: EarningsMath;
  inputs: TrackInput[];
  recipe: (inputs: Record<string, string>) => GenJob[];
}

export type Inputs = Record<string, string>;

export function estimateRunCost(track: Track, inputs: Inputs, table: CostTable): number {
  return roundPollen(
    track.recipe(inputs).reduce((sum, job) => sum + estimateCost(job.kind, job.model, table), 0),
  );
}

/** Worst-case payback multiple if a single sale lands at the LOW price. */
export function paybackMultiple(track: Track, runCost: number): number {
  if (runCost <= 0) return 0;
  return Math.round(track.earnings.priceLow / runCost);
}
