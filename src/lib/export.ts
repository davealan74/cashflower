import { zipSync, strToU8 } from 'fflate';

export interface ExportFile {
  name: string;
  data: Uint8Array | string;
}

export function buildZip(files: ExportFile[]): Blob {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    entries[f.name] = typeof f.data === 'string' ? strToU8(f.data) : f.data;
  }
  const zipped = zipSync(entries, { level: 6 });
  const copy = new Uint8Array(zipped.length);
  copy.set(zipped);
  return new Blob([copy.buffer], { type: 'application/zip' });
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'project'
  );
}
