const SESSION_KEY = 'cashflower.key';
const LOCAL_KEY = 'cashflower.key.remembered';

function initialKey(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

class KeyStore {
  key = $state<string | null>(initialKey());
  remembered = $state<boolean>(!!safeGet(LOCAL_KEY));

  get connected(): boolean {
    return !!this.key;
  }

  get masked(): string {
    if (!this.key) return '';
    return `${this.key.slice(0, 6)}…${this.key.slice(-4)}`;
  }

  set(key: string, remember: boolean): void {
    this.key = key;
    this.remembered = remember;
    try {
      sessionStorage.setItem(SESSION_KEY, key);
      if (remember) localStorage.setItem(LOCAL_KEY, key);
      else localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* private mode — key lives in memory only */
    }
  }

  clear(): void {
    this.key = null;
    this.remembered = false;
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
  }
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

export const keyStore = new KeyStore();
