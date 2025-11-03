import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  decrypt,
  encrypt,
  signPayload,
  verifySignature,
  type EncryptedProxyRequest,
} from "@backend-proxy/shared";
import type { ProxyRequest } from "@backend-proxy/shared/dist/proxy.contract.type.js";

import { customLogger } from "./logger.js";
import { people } from "../data/people.js";

import "dotenv/config";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { proxyResponse } from "./utils.js";

const SECRET_KEY = process.env.SECRET_KEY!;
const SIGNATURE_KEY = process.env.SIGNATURE_KEY!;
const INTERNAL_KEY = process.env.INTERNAL_KEY!;

const app = new Hono();

app.use("*", customLogger);
app.use(
  "/internal/api/*",
  cors({
    origin: process.env.FRONTEND_PROXY!,
    allowHeaders: ["X-Custom-Header", "Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("/internal/*", async (c, next) => {
  const internalKey = c.req.header("X-Internal-Key");

  if (internalKey !== INTERNAL_KEY) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }

  await next();
});

app.post("/api/proxy", async (c) => {
  try {
    const encryptedReq: EncryptedProxyRequest = await c.req.json();
    const signatureHeader = c.req.header("X-Signature");

    if (
      !signatureHeader ||
      !verifySignature(encryptedReq.encrypted, signatureHeader, SIGNATURE_KEY)
    ) {
      const errorData = { error: "Unauthorized" };
      return proxyResponse(c, {
        data: errorData,
        status: 401,
      });
    }

    // Validate encrypted payload
    if (!encryptedReq.encrypted || typeof encryptedReq.encrypted !== "string") {
      const errorData = { error: "Invalid encrypted payload" };
      return proxyResponse(c, {
        data: errorData,
        status: 401,
      });
    }

    let decrypted: ProxyRequest;
    try {
      const decryptedStr = decrypt(encryptedReq.encrypted, SECRET_KEY);
      if (!decryptedStr) {
        const errorData = { error: "Decryption returned empty string" };

        return proxyResponse(c, {
          data: errorData,
          status: 401,
        });
      }
      decrypted = JSON.parse(decryptedStr);
    } catch (e) {
      console.error("Decrypt failed:", e);

      const errorData = { error: "Failed to decrypt payload" };
      return proxyResponse(c, {
        data: errorData,
        status: 401,
      });
    }

    const { url, method, body } = decrypted;
    if (!url || !method) {
      const errorData = { error: "Missing url or method in request" };

      return proxyResponse(c, {
        data: errorData,
        status: 401,
      });
    }

    const isRelative = url.startsWith("/");
    if (!isRelative) {
      const errorData = { error: "Only relative URLs allowed" };
      const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
      const signature = signPayload(encryptedError, SIGNATURE_KEY);
      return c.json(
        { encrypted: encryptedError },
        {
          status: 401,
          headers: { "X-Signature": signature },
        }
      );
    }

    // Route the request internally

    const internalRes = await app.request("/internal" + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (internalRes.status === 404) {
      const errorData = { error: "Internal route not found" };
      return proxyResponse(c, {
        data: errorData,
        status: 404,
      });
    }

    const jsonData = await internalRes.json();

    return proxyResponse(c, {
      data: jsonData,
      status: internalRes.status as ContentfulStatusCode,
    });
  } catch (err) {
    console.error("Proxy error:", err);

    const errorData = { error: "Decryption or routing failed" };
    return proxyResponse(c, {
      data: errorData,
      status: 500,
    });
  }
});

app.get("/internal/api/people", (c) => {
  return c.json(people);
});

app.post("/internal/api/echo", async (c) => {
  const reqBody = await c.req.json();
  return c.json({ received: reqBody });
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
