import { serve } from "@hono/node-server";
import { Hono } from "hono";
import people from "./data.json" with { type: "json" };
import { decrypt, encrypt, type EncryptedProxyRequest } from "@backend-proxy/shared";
import type { ProxyRequest } from "@backend-proxy/shared/dist/proxy.contract.type.js";
import { customLogger } from "./logger.js";

const app = new Hono();

app.use("*", customLogger);

app.post("/api/proxy", async (c) => {
  try {
    const requestBody: EncryptedProxyRequest = await c.req.json();
    const decrypted: ProxyRequest = JSON.parse(decrypt(requestBody.encrypted));
    const {url, method, body} = decrypted

    const res =  await app.request(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const json = await res.json();
    const reEncrypted = encrypt(JSON.stringify(json));

    return c.json({ encrypted: reEncrypted, status: res.status });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Decryption or routing failed" }, 500);
  }
})

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
