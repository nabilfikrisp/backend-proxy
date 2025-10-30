import { EncryptedProxyRequest } from "@backend-proxy/shared";

// THIS NEED TO BE IN ENV
const BACKEND_PROXY = "http://localhost:3001/api/proxy";

export async function POST(req: Request) {
  try {
    const encryptedProxyRequest: EncryptedProxyRequest = await req.json();

    const backendRes = await fetch(BACKEND_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encryptedProxyRequest),
    });

    const data = await backendRes.json();

    return Response.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Proxy failed:", err);
    return Response.json({ error: "Proxy failed" }, { status: 500 });
  }
}
