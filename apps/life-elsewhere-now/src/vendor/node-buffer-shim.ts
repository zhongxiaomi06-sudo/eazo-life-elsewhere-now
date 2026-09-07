/**
 * 浏览器端 node:buffer shim
 *
 * 与 node-crypto-shim 配套：@eazo/sdk 的 decrypt.js 引用了 `Buffer.from` /
 * `Buffer.concat`。该路径仅服务端使用，这里提供最小、安全的兼容层：
 *  - Buffer.from / Buffer.concat 基于 Uint8Array，可正确处理 base64 / hex / utf8
 *  - 顶层求值安全
 */
type BufferInput = Uint8Array | ArrayBuffer | readonly number[] | string;

const utf8 = new TextEncoder();
const utf8Decode = new TextDecoder();

const fromBytes = (input: Uint8Array | ArrayBuffer | readonly number[]): Uint8Array => {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return Uint8Array.from(input as readonly number[]);
};

export const Buffer = {
  from(input: BufferInput, encoding?: string): Uint8Array {
    if (typeof input === 'string') {
      if (encoding === 'hex') {
        const clean = input.replace(/[^0-9a-f]/gi, '');
        const out = new Uint8Array(clean.length / 2);
        for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
        return out;
      }
      if (encoding === 'base64') {
        const binary = globalThis.atob(input.replace(/\s+/g, ''));
        const out = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
        return out;
      }
      return utf8.encode(input);
    }
    return fromBytes(input);
  },
  concat(list: readonly Uint8Array[]): Uint8Array {
    const total = list.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of list) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  },
  isBuffer(value: unknown): boolean {
    return value instanceof Uint8Array;
  },
  alloc(size: number): Uint8Array {
    return new Uint8Array(size);
  },
  byteLength(value: string, encoding?: string): number {
    if (encoding === 'hex') return value.replace(/[^0-9a-f]/gi, '').length / 2;
    if (encoding === 'base64') return Math.floor(value.replace(/\s+/g, '').length * 3 / 4);
    return utf8.encode(value).length;
  },
};

/** 在 Uint8Array 上补齐 Buffer 常用方法（decrypt.js 用到 toString('hex') 等）。 */
export const installBufferMethods = (): void => {
  if (typeof (Uint8Array.prototype as unknown as { toStringBuffer?: unknown }).toStringBuffer !== 'undefined') return;
  const proto = Uint8Array.prototype as unknown as {
    toHex?: () => string;
    toBase64?: () => string;
    toUtf8?: () => string;
  };
  proto.toHex = function toHex(this: Uint8Array): string {
    let out = '';
    for (let i = 0; i < this.length; i += 1) out += this[i]!.toString(16).padStart(2, '0');
    return out;
  };
  proto.toBase64 = function toBase64(this: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < this.length; i += 1) binary += String.fromCharCode(this[i]!);
    return globalThis.btoa(binary);
  };
  proto.toUtf8 = function toUtf8(this: Uint8Array): string {
    return utf8Decode.decode(this);
  };
};

export default { Buffer, installBufferMethods };
