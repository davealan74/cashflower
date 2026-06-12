import { describe, expect, it } from 'vitest';
import { buildAuthorizeUrl, looksLikeKey, makeState, parseAuthFragment } from './byop';

describe('buildAuthorizeUrl', () => {
  it('encodes client id, redirect uri and state', () => {
    const url = buildAuthorizeUrl({
      clientId: 'pk_abc123',
      redirectUri: 'https://cashflower.cru2.net/#/connect',
      state: 'xyz',
    });
    expect(url).toContain('https://enter.pollinations.ai/authorize?');
    expect(url).toContain('client_id=pk_abc123');
    expect(url).toContain(encodeURIComponent('https://cashflower.cru2.net/#/connect'));
    expect(url).toContain('state=xyz');
  });
});

describe('parseAuthFragment', () => {
  it('parses a plain fragment', () => {
    const r = parseAuthFragment('#api_key=sk_Abc123XyZ9&state=s1');
    expect(r).toEqual({ apiKey: 'sk_Abc123XyZ9', state: 's1' });
  });

  it('parses when the fragment sits behind a hash-router path', () => {
    const r = parseAuthFragment('#/connect?api_key=pk_Abc123XyZ9&state=s2');
    expect(r).toEqual({ apiKey: 'pk_Abc123XyZ9', state: 's2' });
  });

  it('rejects garbage and missing keys', () => {
    expect(parseAuthFragment('#/tracks')).toBeNull();
    expect(parseAuthFragment('#api_key=DROP TABLE')).toBeNull();
    expect(parseAuthFragment('')).toBeNull();
  });
});

describe('makeState', () => {
  it('produces 32 hex chars, unique per call', () => {
    const a = makeState();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(makeState()).not.toBe(a);
  });
});

describe('looksLikeKey', () => {
  it('accepts sk_/pk_ keys and rejects others', () => {
    expect(looksLikeKey('sk_U9ASCvqFp0swAg7GP2By')).toBe(true);
    expect(looksLikeKey(' pk_XEHAHPSrjOhC1MED ')).toBe(true);
    expect(looksLikeKey('hello')).toBe(false);
    expect(looksLikeKey('sk_short')).toBe(false);
  });
});
