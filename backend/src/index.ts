import { serve } from "@hono/node-server";
import { Hono } from "hono";
import people from "./data.json" with { type: "json" };

const app = new Hono();


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
