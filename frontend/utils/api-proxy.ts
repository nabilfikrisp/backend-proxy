import { ProxyRequest } from "@/types/proxy.type";

const API_BASE = "/api/proxy";

async function request(proxyRequest: ProxyRequest) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(proxyRequest),
  });

  if (!res.ok) {
    throw new Error(`API Proxy request failed with status ${res.status}`);
  }

  return await res.json();
}

export const apiProxy = {
  get: (url: string) => request({ method: "GET", url }),
  post: (url: string, body: unknown) => request({ method: "POST", url, body }),
  put: (url: string, body: unknown) => request({ method: "PUT", url, body }),
  delete: (url: string) => request({ method: "DELETE", url }),
};
