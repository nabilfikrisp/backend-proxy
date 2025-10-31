import { encrypt } from "@backend-proxy/shared";
import { signPayload } from "@backend-proxy/shared/dist/crypto.js";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const SECRET_KEY = process.env.SECRET_KEY!;
const INTERNAL_KEY = process.env.INTERNAL_KEY!;

export interface ProxyResponseOptions {
  status?: ContentfulStatusCode;
  data: unknown;
}
export function proxyResponse(c: Context, options: ProxyResponseOptions) {
  const { status = 200, data } = options;

  const encryptedData = encrypt(JSON.stringify(data), SECRET_KEY);
  const signature = signPayload(encryptedData, INTERNAL_KEY);

  return c.json(
    { encrypted: encryptedData },
    {
      status,
      headers: { "X-Signature": signature },
    }
  );
}
