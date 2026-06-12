/** Tiny hash router: `#/tracks`, `#/track/printable-art`, `#/ledger`… */

function parse(): { path: string; parts: string[] } {
  const raw = location.hash.replace(/^#\/?/, '');
  const path = raw.split('?')[0];
  return { path: `/${path}`, parts: path.split('/').filter(Boolean) };
}

class Router {
  path = $state(parse().path);
  parts = $state<string[]>(parse().parts);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        const { path, parts } = parse();
        this.path = path;
        this.parts = parts;
        window.scrollTo(0, 0);
      });
    }
  }

  go(path: string): void {
    location.hash = path.startsWith('#') ? path : `#${path}`;
  }
}

export const router = new Router();
