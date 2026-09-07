/**
 * 浏览器端 node:crypto shim
 *
 * @eazo/sdk 0.22.8 的 dist/internal/auth-primitive/decrypt.js 引用了 Node 专属的
 * `crypto.createHash` / `crypto.createDecipheriv`。该模块只被服务端入口
 * （EazoAuthServer）使用 —— 浏览器端 EazoAuthClient 明确由宿主/服务端负责解密
 * （"server always decrypts it with EAZO_PRIVATE_KEY"）。
 *
 * 打包器在静态分析时会扫到这条 require 并把 `crypto` 外部化，产生构建警告。
 * 这里提供一个惰性 shim：
 *  - 顶层求值安全（不抛错、不依赖 Node API）
 *  - 若（意外地）在浏览器被调用，抛出清晰错误说明这是服务端专属路径
 *  - randomUUID 走浏览器原生 Web Crypto
 */
const unavailable = (name: string) => (..._args: unknown[]): never => {
  throw new Error(
    `[life-elsewhere-now] Node \`crypto.${name}\` is not available in the browser. ` +
      'The @eazo/sdk decrypt path is server-only and is never invoked by this app.',
  );
};

export const createHash = unavailable('createHash');
export const createDecipheriv = unavailable('createDecipheriv');
export const createCipheriv = unavailable('createCipheriv');
export const createHmac = unavailable('createHmac');
export const createSign = unavailable('createSign');
export const createVerify = unavailable('createVerify');
export const randomBytes = unavailable('randomBytes');
export const generateKeyPairSync = unavailable('generateKeyPairSync');
export const generateKeyPair = unavailable('generateKeyPair');
export const timingSafeEqual = unavailable('timingSafeEqual');
export const getCiphers = (): string[] => [];

/** 浏览器端可用的：Web Crypto 的 randomUUID（Node 同 API）。 */
export const randomUUID = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

export default {
  createHash,
  createDecipheriv,
  createCipheriv,
  createHmac,
  createSign,
  createVerify,
  randomBytes,
  randomUUID,
  generateKeyPairSync,
  generateKeyPair,
  timingSafeEqual,
  getCiphers,
};
