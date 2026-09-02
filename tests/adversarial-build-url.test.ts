import { describe, expect, it } from 'vitest';
import { buildUrl } from '../src/http/fetch-http-client';

describe('Adversarial & Stress Testing for buildUrl', () => {
  const standardBaseUrl = new URL('https://api.lily.test/api/v1/');
  const rootBaseUrl = new URL('https://api.lily.test/');

  describe('1. Deeply nested and unusual paths', () => {
    it('handles deeply nested paths with 50+ path segments', () => {
      const segments = Array.from({ length: 60 }, (_, i) => `seg_${String(i)}`);
      const deepPath = segments.join('/');
      const url = buildUrl(rootBaseUrl, deepPath);

      expect(url.pathname).toBe(`/${deepPath}`);
      expect(url.toString()).toBe(`https://api.lily.test/${deepPath}`);
    });

    it('handles leading slash vs no leading slash on deep paths identically', () => {
      const deepPath = 'alpha/beta/gamma/delta/epsilon/zeta/eta/theta';
      const urlWithoutSlash = buildUrl(rootBaseUrl, deepPath);
      const urlWithSlash = buildUrl(rootBaseUrl, `/${deepPath}`);

      expect(urlWithoutSlash.toString()).toBe(urlWithSlash.toString());
      expect(urlWithoutSlash.pathname).toBe(`/${deepPath}`);
    });

    it('resolves relative dot segments (../ and ./) correctly via WHATWG URL', () => {
      const url = buildUrl(standardBaseUrl, '../v2/wallets/./sub');
      expect(url.pathname).toBe('/api/v2/wallets/sub');
      expect(url.toString()).toBe('https://api.lily.test/api/v2/wallets/sub');
    });

    it('handles path with query-like strings or hash-like strings in path', () => {
      const url = buildUrl(rootBaseUrl, 'v1/resource/id:1234');
      expect(url.pathname).toBe('/v1/resource/id:1234');
    });
  });

  describe('2. Very long query strings and keys/values', () => {
    it('handles a query string with 10,000+ characters without truncation or error', () => {
      const longValue = 'a'.repeat(12000);
      const url = buildUrl(rootBaseUrl, 'v1/data', { payload: longValue });

      expect(url.searchParams.get('payload')).toBe(longValue);
      expect(url.searchParams.get('payload')?.length).toBe(12000);
      expect(url.toString().length).toBeGreaterThan(12000);
    });

    it('handles 500 distinct query parameters', () => {
      const queryObj: Record<string, string | number | boolean> = {};
      for (let i = 0; i < 500; i++) {
        queryObj[`key_${String(i)}`] = `value_${String(i)}`;
      }

      const url = buildUrl(rootBaseUrl, 'v1/bulk', queryObj);
      expect(url.searchParams.get('key_0')).toBe('value_0');
      expect(url.searchParams.get('key_499')).toBe('value_499');
      expect(Array.from(url.searchParams.keys()).length).toBe(500);
    });

    it('handles very long query keys (1,000+ chars)', () => {
      const longKey = 'k'.repeat(1000);
      const url = buildUrl(rootBaseUrl, 'v1/data', { [longKey]: 'val' });

      expect(url.searchParams.get(longKey)).toBe('val');
      expect(url.toString()).toContain(longKey);
    });
  });

  describe('3. Extreme numeric values', () => {
    it('handles Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, and Number.MAX_VALUE', () => {
      const url = buildUrl(rootBaseUrl, 'v1/numbers', {
        maxSafe: Number.MAX_SAFE_INTEGER,
        minSafe: Number.MIN_SAFE_INTEGER,
        maxVal: Number.MAX_VALUE,
        minVal: Number.MIN_VALUE,
        epsilon: Number.EPSILON,
      });

      expect(url.searchParams.get('maxSafe')).toBe(String(Number.MAX_SAFE_INTEGER));
      expect(url.searchParams.get('minSafe')).toBe(String(Number.MIN_SAFE_INTEGER));
      expect(url.searchParams.get('maxVal')).toBe(String(Number.MAX_VALUE));
      expect(url.searchParams.get('minVal')).toBe(String(Number.MIN_VALUE));
      expect(url.searchParams.get('epsilon')).toBe(String(Number.EPSILON));
    });

    it('handles negative zero (-0) correctly as "0"', () => {
      const url = buildUrl(rootBaseUrl, 'v1/numbers', {
        negZero: -0,
        posZero: 0,
      });

      expect(url.searchParams.get('negZero')).toBe('0');
      expect(url.searchParams.get('posZero')).toBe('0');
    });

    it('handles NaN, Infinity, -Infinity, and scientific notation (1e-7, 1e21)', () => {
      const url = buildUrl(rootBaseUrl, 'v1/numbers', {
        nan: NaN,
        posInf: Infinity,
        negInf: -Infinity,
        smallSci: 1e-7,
        largeSci: 1e21,
      });

      expect(url.searchParams.get('nan')).toBe('NaN');
      expect(url.searchParams.get('posInf')).toBe('Infinity');
      expect(url.searchParams.get('negInf')).toBe('-Infinity');
      expect(url.searchParams.get('smallSci')).toBe(String(1e-7));
      expect(url.searchParams.get('largeSci')).toBe(String(1e21));
    });
  });

  describe('4. Unicode, emojis, RTL characters, and non-ASCII glyphs', () => {
    it('handles Arabic (RTL) query keys and values', () => {
      const url = buildUrl(rootBaseUrl, 'v1/search', {
        'استعلام': 'مرحبا بالعالم',
      });

      expect(url.searchParams.get('استعلام')).toBe('مرحبا بالعالم');
      expect(url.search).toContain(encodeURIComponent('استعلام'));
    });

    it('handles Hebrew (RTL) query values', () => {
      const url = buildUrl(rootBaseUrl, 'v1/search', {
        greeting: 'שלום עולם',
      });

      expect(url.searchParams.get('greeting')).toBe('שלום עולם');
    });

    it('handles complex multi-codepoint emojis and ZWJ sequences', () => {
      const familyEmoji = '👨‍👩‍👧‍👦';
      const rainbowFlag = '🏳️‍🌈';
      const skinTone = '👍🏽';

      const url = buildUrl(rootBaseUrl, 'v1/reactions', {
        family: familyEmoji,
        flag: rainbowFlag,
        thumbs: skinTone,
      });

      expect(url.searchParams.get('family')).toBe(familyEmoji);
      expect(url.searchParams.get('flag')).toBe(rainbowFlag);
      expect(url.searchParams.get('thumbs')).toBe(skinTone);
    });

    it('handles CJK (Chinese, Japanese, Korean) characters and Cyrillic', () => {
      const url = buildUrl(rootBaseUrl, 'v1/i18n', {
        zh: '你好世界',
        ja: 'こんにちは世界',
        ko: '안녕하세요 세계',
        ru: 'Привет мир',
      });

      expect(url.searchParams.get('zh')).toBe('你好世界');
      expect(url.searchParams.get('ja')).toBe('こんにちは世界');
      expect(url.searchParams.get('ko')).toBe('안녕하세요 세계');
      expect(url.searchParams.get('ru')).toBe('Привет мир');
    });

    it('handles special whitespace, zero-width spaces, and control characters', () => {
      const zwsp = 'zero\u200Bwidth\uFEFFspace';
      const url = buildUrl(rootBaseUrl, 'v1/text', {
        zwsp,
      });

      expect(url.searchParams.get('zwsp')).toBe(zwsp);
    });
  });

  describe('5. Malformed and unusual path strings', () => {
    it('handles consecutive slashes in path properly', () => {
      const url = buildUrl(rootBaseUrl, 'v1//agents///search');
      expect(url.pathname).toBe('/v1//agents///search');
      expect(url.toString()).toBe('https://api.lily.test/v1//agents///search');
    });

    it('handles empty string path and single slash path', () => {
      const urlEmpty = buildUrl(rootBaseUrl, '');
      const urlSlash = buildUrl(rootBaseUrl, '/');

      expect(urlEmpty.pathname).toBe('/');
      expect(urlSlash.pathname).toBe('/');
    });

    it('handles paths with special URL characters like brackets, semicolons, colons', () => {
      const url = buildUrl(rootBaseUrl, 'v1/items;param=1/(nested):filter');
      expect(url.pathname).toBe('/v1/items;param=1/(nested):filter');
    });
  });

  describe('6. Object prototype keys and inheritance safety', () => {
    it('safely handles own properties named toString, hasOwnProperty, valueOf, constructor', () => {
      const trickyQuery: Record<string, string | number | boolean | undefined> = {
        toString: 'customToString',
        hasOwnProperty: 'customHasOwn',
        valueOf: 'customValueOf',
        constructor: 'customConstructor',
        isPrototypeOf: 'customIsProto',
      };

      const url = buildUrl(rootBaseUrl, 'v1/props', trickyQuery);

      expect(url.searchParams.get('toString')).toBe('customToString');
      expect(url.searchParams.get('hasOwnProperty')).toBe('customHasOwn');
      expect(url.searchParams.get('valueOf')).toBe('customValueOf');
      expect(url.searchParams.get('constructor')).toBe('customConstructor');
      expect(url.searchParams.get('isPrototypeOf')).toBe('customIsProto');
    });

    it('ignores inherited properties from Object.prototype', () => {
      const protoObj = { inheritedProp: 'should_not_appear_if_not_own_enumerable' };
      const childObj = Object.create(protoObj) as Record<string, string | number | boolean | undefined>;
      childObj.ownProp = 'valid';

      const url = buildUrl(rootBaseUrl, 'v1/inheritance', childObj);

      expect(url.searchParams.get('ownProp')).toBe('valid');
      expect(url.searchParams.has('inheritedProp')).toBe(false);
    });

    it('safely handles Object.create(null) dictionary without prototype', () => {
      const nullProtoDict: Record<string, string | number | boolean | undefined> = Object.create(null) as Record<
        string,
        string | number | boolean | undefined
      >;
      nullProtoDict.key1 = 'val1';
      nullProtoDict.key2 = 123;
      nullProtoDict.key3 = false;
      nullProtoDict.key4 = undefined;

      const url = buildUrl(rootBaseUrl, 'v1/null-proto', nullProtoDict);

      expect(url.searchParams.get('key1')).toBe('val1');
      expect(url.searchParams.get('key2')).toBe('123');
      expect(url.searchParams.get('key3')).toBe('false');
      expect(url.searchParams.has('key4')).toBe(false);
    });

    it('safely handles query with __proto__ key if defined as own property', () => {
      const queryWithProto = JSON.parse('{"__proto__": "custom_proto_val", "foo": "bar"}') as Record<
        string,
        string | number | boolean | undefined
      >;

      const url = buildUrl(rootBaseUrl, 'v1/proto-test', queryWithProto);

      expect(url.searchParams.get('foo')).toBe('bar');
      if (Object.prototype.hasOwnProperty.call(queryWithProto, '__proto__')) {
        expect(url.searchParams.get('__proto__')).toBe('custom_proto_val');
      }
    });
  });

  describe('7. Query parameter overwriting and order', () => {
    it('sets parameters via searchParams.set semantics (replaces existing if same key occurs)', () => {
      const url = buildUrl(rootBaseUrl, 'v1/test', {
        foo: 'first',
      });
      expect(url.searchParams.get('foo')).toBe('first');
    });

    it('handles query parameters when base URL is root with search params', () => {
      const baseUrlWithQuery = new URL('https://api.lily.test/?initial=true');
      const url = buildUrl(baseUrlWithQuery, '', {
        additional: 'param',
      });

      expect(url.searchParams.get('initial')).toBe('true');
      expect(url.searchParams.get('additional')).toBe('param');
    });
  });

  describe('8. Empty strings and falsy-like string values', () => {
    it('serializes empty strings correctly as key= without dropping the key', () => {
      const url = buildUrl(rootBaseUrl, 'v1/filter', {
        query: '',
        tag: 'all',
      });

      expect(url.searchParams.has('query')).toBe(true);
      expect(url.searchParams.get('query')).toBe('');
      expect(url.searchParams.get('tag')).toBe('all');
      expect(url.toString()).toBe('https://api.lily.test/v1/filter?query=&tag=all');
    });

    it('serializes "null" or "false" string values as literal strings', () => {
      const url = buildUrl(rootBaseUrl, 'v1/flags', {
        strNull: 'null',
        strFalse: 'false',
        strZero: '0',
      });

      expect(url.searchParams.get('strNull')).toBe('null');
      expect(url.searchParams.get('strFalse')).toBe('false');
      expect(url.searchParams.get('strZero')).toBe('0');
    });

    it('handles non-string/non-number runtime values if passed without crashing', () => {
      const runtimeQuirks = {
        arrayVal: [1, 2, 3],
        nullVal: null,
      } as unknown as Record<string, string | number | boolean | undefined>;

      const url = buildUrl(rootBaseUrl, 'v1/quirks', runtimeQuirks);

      expect(url.searchParams.get('arrayVal')).toBe('1,2,3');
      expect(url.searchParams.get('nullVal')).toBe('null');
    });
  });

  describe('9. Stress & Performance Benchmarks', () => {
    it('executes 10,000 buildUrl invocations with varied inputs in < 200ms', () => {
      const start = performance.now();
      for (let i = 0; i < 10_000; i++) {
        buildUrl(rootBaseUrl, `/v1/items/${String(i % 100)}`, {
          page: i % 10,
          active: i % 2 === 0,
          query: i % 3 === 0 ? 'search term with spaces & symbols' : undefined,
        });
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
