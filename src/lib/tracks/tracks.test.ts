import { describe, expect, it } from 'vitest';
import { DEFAULT_COSTS } from '../costs';
import { chunkScript } from '../api/client';
import { TRACKS, getTrack } from './index';
import { estimateRunCost, paybackMultiple } from './types';

describe('track definitions', () => {
  it('exposes six tracks with unique ids', () => {
    expect(TRACKS).toHaveLength(6);
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(6);
  });

  it('every recipe yields jobs with unique ids and filenames', () => {
    for (const track of TRACKS) {
      const defaults = Object.fromEntries(track.inputs.map((i) => [i.id, i.default ?? 'sample value']));
      const jobs = track.recipe(defaults);
      expect(jobs.length).toBeGreaterThan(0);
      expect(new Set(jobs.map((j) => j.id)).size).toBe(jobs.length);
      expect(new Set(jobs.map((j) => j.filename)).size).toBe(jobs.length);
      for (const job of jobs) {
        if (job.kind !== 'audio') {
          expect(job.prompt({}).length).toBeGreaterThan(20);
        }
      }
    }
  });

  it('weaves user inputs into prompts', () => {
    const track = getTrack('printable-art')!;
    const jobs = track.recipe({ theme: 'Maltese luzzu boats', style: 'vintage travel poster', count: '4' });
    expect(jobs.filter((j) => j.kind === 'image')).toHaveLength(4);
    expect(jobs[0].prompt({})).toContain('Maltese luzzu boats');
    expect(jobs.at(-1)!.prompt({})).toContain('Maltese luzzu boats');
  });

  it('passes earlier text results into dependent jobs', () => {
    const track = getTrack('voiceover')!;
    const jobs = track.recipe({ kind: '30-second radio ad', brief: 'bakery launch', voice: 'nova' });
    const narration = jobs.find((j) => j.id === 'narration')!;
    expect(narration.prompt({ script: 'Hello world script.' })).toBe('Hello world script.');
    expect(narration.voice).toBe('nova');
  });

  it('every run is at least 100x cheaper than the LOW sale price', () => {
    for (const track of TRACKS) {
      const defaults = Object.fromEntries(track.inputs.map((i) => [i.id, i.default ?? 'sample value']));
      const cost = estimateRunCost(track, defaults, DEFAULT_COSTS);
      expect(cost).toBeGreaterThan(0);
      expect(paybackMultiple(track, cost)).toBeGreaterThanOrEqual(100);
    }
  });
});

describe('chunkScript', () => {
  it('keeps short scripts whole', () => {
    expect(chunkScript('One sentence.')).toEqual(['One sentence.']);
  });

  it('splits long scripts on sentence boundaries under the cap', () => {
    const long = Array.from({ length: 30 }, (_, i) => `This is sentence number ${i + 1} of the meditation.`).join(' ');
    const chunks = chunkScript(long, 200);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(200);
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(long.replace(/\s+/g, ' '));
  });

  it('returns empty for empty input', () => {
    expect(chunkScript('   ')).toEqual([]);
  });
});
