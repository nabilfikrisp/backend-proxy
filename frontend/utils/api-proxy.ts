import { decrypt, encrypt } from "@backend-proxy/shared";
import {
  EncryptedProxyResponse,
  ProxyRequest,
} from "@backend-proxy/shared/dist/proxy.contract.type";

const NEXT_API_PROXY = "/api/proxy";

async function request(proxyRequest: ProxyRequest) {
  const encrypted = encrypt(JSON.stringify(proxyRequest));

  const res = await fetch(NEXT_API_PROXY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ encrypted }),
  });

  if (!res.ok) {
    throw new Error(`API Proxy request failed with status ${res.status}`);
  }

  const data: EncryptedProxyResponse = await res.json();
  const decrypted = decrypt(data.encrypted);

  return JSON.parse(decrypted);
}

export const apiProxy = {
  get: (url: string) => request({ method: "GET", url }),
  post: (url: string, body: unknown) => request({ method: "POST", url, body }),
  put: (url: string, body: unknown) => request({ method: "PUT", url, body }),
  delete: (url: string) => request({ method: "DELETE", url }),
};
