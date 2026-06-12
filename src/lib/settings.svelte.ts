import { DEFAULT_COSTS, type CostTable } from './costs';

const SETTINGS_KEY = 'cashflower.settings';

interface Persisted {
  byopClientId?: string;
  costs?: CostTable;
}

function load(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

class Settings {
  byopClientId = $state<string>(load().byopClientId ?? import.meta.env.VITE_BYOP_CLIENT_ID ?? '');
  costs = $state<CostTable>(load().costs ?? structuredClone(DEFAULT_COSTS));

  save(): void {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ byopClientId: this.byopClientId, costs: this.costs } satisfies Persisted),
      );
    } catch {
      /* ignore */
    }
  }

  resetCosts(): void {
    this.costs = structuredClone(DEFAULT_COSTS);
    this.save();
  }
}

export const settings = new Settings();
