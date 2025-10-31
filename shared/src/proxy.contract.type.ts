export type EncryptedProxyRequest = {
  encrypted: string;
};

export type EncryptedProxyResponse = {
  encrypted: string;
};

export type ProxyRequest = {
  url: string;
  method: HttpMethod;
  body?: unknown | undefined;
};

export const HTTP_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];
