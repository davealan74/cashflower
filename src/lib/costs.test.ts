import { describe, expect, it } from 'vitest';
import { DEFAULT_COSTS, estimateCost, formatPollen, roundPollen } from './costs';

describe('estimateCost', () => {
  it('prices known image models from the table', () => {
    expect(estimateCost('image', 'flux')).toBe(0.002);
    expect(estimateCost('image', 'flux', DEFAULT_COSTS, 8)).toBe(0.016);
    expect(estimateCost('image', 'gptimage')).toBe(0.015);
  });

  it('falls back to the most expensive known model for unknown models', () => {
    expect(estimateCost('image', 'mystery-model')).toBe(0.022);
    expect(estimateCost('text', 'mystery-model')).toBe(0.0001);
  });

  it('prices text and audio', () => {
    expect(estimateCost('text', 'openai')).toBe(0.0001);
    expect(estimateCost('audio', 'openai-audio')).toBe(0.03);
  });

  it('returns 0 for non-positive units', () => {
    expect(estimateCost('image', 'flux', DEFAULT_COSTS, 0)).toBe(0);
  });

  it('avoids float dust on summed estimates', () => {
    expect(roundPollen(0.001 + 0.002 + 0.0001)).toBe(0.0031);
  });
});

describe('formatPollen', () => {
  it('shows tiny amounts without scientific notation', () => {
    expect(formatPollen(0.0031)).toBe('0.0031');
    expect(formatPollen(0)).toBe('0');
    expect(formatPollen(1.5)).toBe('1.50');
  });
});
