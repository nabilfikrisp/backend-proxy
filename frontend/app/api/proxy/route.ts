import { ProxyRequest } from "@/types/proxy.type";

const BACKEND_BASE = "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { url, method = "GET", body }: ProxyRequest = await req.json();

    const backendRes = await fetch(BACKEND_BASE + url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await backendRes.json();

    return Response.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Proxy failed:", err);
    return Response.json({ error: "Proxy failed" }, { status: 500 });
  }
}
