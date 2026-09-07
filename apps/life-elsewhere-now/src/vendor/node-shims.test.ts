import { describe, expect, test } from 'vitest';
import { Buffer, installBufferMethods } from './node-buffer-shim';
import { createHash, createDecipheriv, randomUUID } from './node-crypto-shim';

describe('node-crypto-shim (browser-side safe stubs)', () => {
  test('top-level import does not throw and randomUUID returns a UUID', () => {
    expect(randomUUID()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('server-only crypto calls fail with an explicit message', () => {
    expect(() => createHash('sha256')).toThrow(/server-only|not available in the browser/i);
    expect(() => createDecipheriv('aes-256-gcm', new Uint8Array(32), new Uint8Array(12))).toThrow(/server-only|not available in the browser/i);
  });

  test('Buffer.from handles hex, base64 and utf8', () => {
    expect([...Buffer.from('0a0b0c', 'hex')]).toEqual([10, 11, 12]);
    expect([...Buffer.from('AAEC', 'base64')]).toEqual([0, 1, 2]);
    expect(new TextDecoder().decode(Buffer.from('你好'))).toBe('你好');
  });

  test('Buffer.concat merges chunks in order', () => {
    const merged = Buffer.concat([new Uint8Array([1, 2]), new Uint8Array([3])]);
    expect([...merged]).toEqual([1, 2, 3]);
  });

  test('installBufferMethods adds hex/base64 helpers once', () => {
    installBufferMethods();
    installBufferMethods();
    const bytes = new Uint8Array([255, 0, 16]);
    expect((bytes as unknown as { toHex(): string }).toHex()).toBe('ff0010');
  });
});
