import { describe, it, expect } from 'vitest';
import { encodePathSegment } from '../src/http/path';

describe('encodePathSegment', () => {
  it('encodes forward slashes', () => {
    expect(encodePathSegment('a/b')).toBe('a%2Fb');
  });

  it('encodes question marks', () => {
    expect(encodePathSegment('a?b')).toBe('a%3Fb');
  });

  it('encodes hash symbols', () => {
    expect(encodePathSegment('a#b')).toBe('a%23b');
  });

  it('encodes spaces', () => {
    expect(encodePathSegment('a b')).toBe('a%20b');
  });

  it('leaves alphanumeric characters unchanged', () => {
    expect(encodePathSegment('abc123')).toBe('abc123');
  });

  it('encodes unicode characters', () => {
    expect(encodePathSegment('café')).toBe('caf%C3%A9');
  });
});
