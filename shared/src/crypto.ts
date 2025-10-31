import CryptoJs from "crypto-js";

export function encrypt(data: string, secret_key: string): string {
  return CryptoJs.AES.encrypt(data, secret_key).toString();
}

export function decrypt(encrypted: string, secret_key: string): string {
  const bytes = CryptoJs.AES.decrypt(encrypted, secret_key);
  return bytes.toString(CryptoJs.enc.Utf8);
}

export function signPayload(payload: string, signing_key: string): string {
  return CryptoJs.HmacSHA256(payload, signing_key).toString();
}

export function verifySignature(
  payload: string,
  signature: string,
  signing_key: string
): boolean {
  const expectedSignature = signPayload(payload, signing_key);
  return expectedSignature === signature;
}
