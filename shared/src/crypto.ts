import CryptoJs from "crypto-js";

// THIS NEED TO BE IN ENV
const SECRET_KEY = "my_secret_key_123";

export function encrypt(data: string): string {
  return CryptoJs.AES.encrypt(data, SECRET_KEY).toString();
}

export function decrypt(encrypted: string): string {
  const bytes = CryptoJs.AES.decrypt(encrypted, SECRET_KEY);
  return bytes.toString(CryptoJs.enc.Utf8);
}
