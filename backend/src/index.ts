import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  decrypt,
  encrypt,
  type EncryptedProxyRequest,
} from "@backend-proxy/shared";
import type { ProxyRequest } from "@backend-proxy/shared/dist/proxy.contract.type.js";

import { customLogger } from "./logger.js";
import { people } from "../data/people.js";

import "dotenv/config";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { verifySignature } from "@backend-proxy/shared/dist/crypto.js";

const SECRET_KEY = process.env.SECRET_KEY!;
const INTERNAL_KEY = process.env.INTERNAL_KEY!;

const app = new Hono();

app.use("*", customLogger);
app.use(
  "/api/*",
  cors({
    origin: process.env.FRONTEND_PROXY!,
    allowHeaders: ["X-Custom-Header", "Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.post("/api/proxy", async (c) => {
  try {
    const encryptedReq: EncryptedProxyRequest = await c.req.json();
    const signatureHeader = c.req.header("X-Signature");

    if (
      !signatureHeader ||
      !verifySignature(encryptedReq.encrypted, signatureHeader, INTERNAL_KEY)
    ) {
      const errorData = { error: "Unauthorized" };
      const encryptedResponse = encrypt(JSON.stringify(errorData), SECRET_KEY);
      return c.json({ encrypted: encryptedResponse }, 401);
    }

    // Validate encrypted payload
    if (!encryptedReq.encrypted || typeof encryptedReq.encrypted !== "string") {
      const errorData = { error: "Invalid encrypted payload" };
      const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
      return c.json({ encrypted: encryptedError }, 400);
    }

    let decrypted: ProxyRequest;
    try {
      const decryptedStr = decrypt(encryptedReq.encrypted, SECRET_KEY);
      if (!decryptedStr) {
        const errorData = { error: "Decryption returned empty string" };
        const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
        return c.json({ encrypted: encryptedError }, 400);
      }
      decrypted = JSON.parse(decryptedStr);
    } catch (e) {
      console.error("❌ Decrypt failed:", e);
      const errorData = { error: "Failed to decrypt payload" };
      const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
      return c.json({ encrypted: encryptedError }, 400);
    }

    const { url, method, body } = decrypted;
    if (!url || !method) {
      const errorData = { error: "Missing url or method in request" };
      const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
      return c.json({ encrypted: encryptedError }, 400);
    }

    const isRelative = url.startsWith("/");
    if (!isRelative) {
      const errorData = { error: "Only relative URLs allowed" };
      const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
      return c.json({ encrypted: encryptedError }, 400);
    }

    // Route the request internally
    const internalRes = await app.request(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const jsonData = await internalRes.json();
    const reEncrypted = encrypt(JSON.stringify(jsonData), SECRET_KEY);

    return c.json(
      { encrypted: reEncrypted },
      internalRes.status as ContentfulStatusCode
    );
  } catch (err) {
    console.error("Proxy error:", err);
    const errorData = { error: "Decryption or routing failed" };
    const encryptedError = encrypt(JSON.stringify(errorData), SECRET_KEY);
    return c.json({ encrypted: encryptedError }, 500);
  }
});

app.get("/api/people", (c) => {
  return c.json(people);
});

app.post("/api/echo", async (c) => {
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
