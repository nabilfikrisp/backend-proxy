import { serve } from "@hono/node-server";
import { Hono } from "hono";
import people from "./data.json" with { type: "json" };

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/people", (c) => {
  return c.json(people);
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
