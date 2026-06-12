export type GenKind = 'image' | 'text' | 'audio';

/**
 * Pollen cost table (1 pollen ≈ $1). Values are deliberately conservative
 * over-estimates so the ROI ledger never flatters the user. Editable in
 * Settings; reconciled against /account/usage when the key permits.
 */
export interface CostTable {
  image: Record<string, number>;
  text: Record<string, number>;
  audio: number;
}

export const DEFAULT_COSTS: CostTable = {
  image: {
    flux: 0.002,
    turbo: 0.004,
    kontext: 0.006,
    gptimage: 0.015,
    nanobanana: 0.022,
  },
  text: {
    openai: 0.0001,
    mistral: 0.0001,
  },
  audio: 0.03,
};

export function estimateCost(
  kind: GenKind,
  model: string,
  table: CostTable = DEFAULT_COSTS,
  units = 1,
): number {
  if (units <= 0) return 0;
  let per: number;
  switch (kind) {
    case 'image':
      per = table.image[model] ?? Math.max(...Object.values(table.image));
      break;
    case 'text':
      per = table.text[model] ?? Math.max(...Object.values(table.text));
      break;
    case 'audio':
      per = table.audio;
      break;
  }
  return roundPollen(per * units);
}

/** Avoid float dust: pollen amounts to 6 dp. */
export function roundPollen(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function formatPollen(n: number): string {
  if (n === 0) return '0';
  if (n < 0.01) return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return n.toFixed(2);
}

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 4 : 2,
  });
}
