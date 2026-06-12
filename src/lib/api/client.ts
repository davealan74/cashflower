import { ApiError } from './errors';

export interface ImageOptions {
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  negative?: string;
}

export interface ImageResult {
  blob: Blob;
  url: string;
  throttled: boolean;
  width: number;
  height: number;
}

export interface TextOptions {
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

const GEN_BASE = 'https://gen.pollinations.ai';
const ACCOUNT_BASE = 'https://enter.pollinations.ai/api/account';

/**
 * Pollinations client. All generation calls flow through a single
 * sequential queue — one request in flight, ever. This is both polite to
 * the API and the documented-safe pattern for BYOP apps.
 */
export class PollinationsClient {
  private getKey: () => string | null;
  private chain: Promise<unknown> = Promise.resolve();

  constructor(getKey: () => string | null) {
    this.getKey = getKey;
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    this.chain = run.catch(() => undefined);
    return run;
  }

  private headers(): Record<string, string> {
    const key = this.getKey();
    return key ? { Authorization: `Bearer ${key}` } : {};
  }

  private requireKey(): void {
    if (!this.getKey()) {
      throw new ApiError('auth', 'Connect your Pollinations account first — Cashflower runs on your own pollen.');
    }
  }

  image(prompt: string, opts: ImageOptions = {}): Promise<ImageResult> {
    return this.enqueue(async () => {
      this.requireKey();
      const width = opts.width ?? 1024;
      const height = opts.height ?? 1024;
      const params = new URLSearchParams({
        model: opts.model ?? 'flux',
        width: String(width),
        height: String(height),
        nologo: 'true',
        private: 'true',
        referrer: 'cashflower',
      });
      if (opts.seed !== undefined) params.set('seed', String(opts.seed));
      if (opts.negative) params.set('negative_prompt', opts.negative);

      const res = await this.fetch(`${GEN_BASE}/image/${encodeURIComponent(prompt)}?${params}`);
      if (!res.ok) throw ApiError.fromStatus(res.status, await safeText(res));
      const blob = await res.blob();
      const dims = await imageDims(blob);
      // When throttling, Pollinations sends a 768×512 placeholder instead
      // of an HTTP 429 — a dimension mismatch is the only reliable signal.
      const throttled = dims.width !== width || dims.height !== height;
      return { blob, url: URL.createObjectURL(blob), throttled, ...dims };
    });
  }

  text(prompt: string, opts: TextOptions = {}): Promise<string> {
    return this.enqueue(async () => {
      this.requireKey();
      const messages = [];
      if (opts.system) messages.push({ role: 'system', content: opts.system });
      messages.push({ role: 'user', content: prompt });

      const res = await this.fetch(`${GEN_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers() },
        body: JSON.stringify({
          model: opts.model ?? 'openai',
          messages,
          temperature: opts.temperature ?? 0.8,
          max_tokens: opts.maxTokens ?? 2400,
          stream: false,
          referrer: 'cashflower',
        }),
      });
      if (!res.ok) throw ApiError.fromStatus(res.status, await safeText(res));
      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) throw new ApiError('other', 'The text model returned an empty response — regenerate to try again.');
      return content.trim();
    });
  }

  /** TTS. Long scripts are chunked by the caller; one chunk per call. */
  tts(text: string, voice: string): Promise<Blob> {
    return this.enqueue(async () => {
      this.requireKey();
      const params = new URLSearchParams({ voice, referrer: 'cashflower' });
      const res = await this.fetch(`${GEN_BASE}/audio/${encodeURIComponent(text)}?${params}`);
      if (!res.ok) throw ApiError.fromStatus(res.status, await safeText(res));
      const blob = await res.blob();
      if (!blob.type.startsWith('audio')) {
        throw new ApiError('other', 'Expected audio but got something else — regenerate to try again.');
      }
      return blob;
    });
  }

  async account(path: 'profile' | 'balance' | 'usage', query = ''): Promise<Record<string, unknown> | null> {
    const key = this.getKey();
    if (!key) return null;
    try {
      const res = await fetch(`${ACCOUNT_BASE}/${path}${query}`, { headers: this.headers() });
      if (!res.ok) return null; // missing account permission — degrade silently
      return await res.json();
    } catch {
      return null;
    }
  }

  async balance(): Promise<number | null> {
    const data = await this.account('balance');
    return typeof data?.balance === 'number' ? data.balance : null;
  }

  private async fetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init ?? { headers: this.headers() });
    } catch {
      throw new ApiError('network', 'Could not reach Pollinations — check your connection and regenerate.');
    }
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

async function imageDims(blob: Blob): Promise<{ width: number; height: number }> {
  try {
    const bmp = await createImageBitmap(blob);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return dims;
  } catch {
    return { width: 0, height: 0 };
  }
}

/** Split long TTS scripts into URL-safe chunks on sentence boundaries. */
export function chunkScript(text: string, maxLen = 600): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean ? [clean] : [];
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [clean];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) {
      chunks.push(current.trim());
      current = '';
    }
    current += s;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
