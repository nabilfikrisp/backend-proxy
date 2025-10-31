import CryptoJs from "crypto-js";

export function encrypt(data: string, secret_key: string): string {
  return CryptoJs.AES.encrypt(data, secret_key).toString();
}

export function decrypt(encrypted: string, secret_key: string): string {
  const bytes = CryptoJs.AES.decrypt(encrypted, secret_key);
  return bytes.toString(CryptoJs.enc.Utf8);
}
