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

const SECRET_KEY = process.env.SECRET_KEY!;

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

    // Validate encrypted payload
    if (!encryptedReq.encrypted || typeof encryptedReq.encrypted !== "string") {
      throw new Error("Invalid encrypted payload");
    }

    let decrypted: ProxyRequest;
    try {
      const decryptedStr = decrypt(encryptedReq.encrypted, SECRET_KEY);
      if (!decryptedStr) throw new Error("Empty decryption result");
      decrypted = JSON.parse(decryptedStr);
    } catch (e) {
      console.error("❌ Decrypt failed:", e);
      return c.json({ error: "Failed to decrypt payload" }, 400);
    }

    const { url, method, body } = decrypted;
    if (!url || !method) throw new Error("Missing url or method in payload");

    const isRelative = url.startsWith("/");
    if (!isRelative) {
      return c.json({ error: "Only relative URLs allowed" }, 400);
    }

    // Route the request internally
    const internalRes = await app.request(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const jsonData = await internalRes.json();
    const reEncrypted = encrypt(JSON.stringify(jsonData), SECRET_KEY);

    return c.json({ encrypted: reEncrypted, status: internalRes.status });
  } catch (err) {
    console.error("Proxy error:", err);
    return c.json({ error: "Decryption or routing failed" }, 500);
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
