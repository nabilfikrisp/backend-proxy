import { decrypt, encrypt, EncryptedProxyRequest } from "@backend-proxy/shared";

const BACKEND_PROXY = process.env.BACKEND_PROXY!;
const SECRET_KEY = process.env.SECRET_KEY!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY!;

export async function POST(req: Request) {
  try {
    const encryptedProxyRequest: EncryptedProxyRequest = await req.json();
    const decryptProxyRequest = decrypt(
      encryptedProxyRequest.encrypted,
      PUBLIC_KEY
    );

    const reEncryptedProxyRequest = encrypt(decryptProxyRequest, SECRET_KEY);
    const backendRes = await fetch(BACKEND_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encrypted: reEncryptedProxyRequest }),
    });

    const data = await backendRes.json();
    const decryptedData = decrypt(data.encrypted, SECRET_KEY);
    const reEncryptedData = encrypt(decryptedData, PUBLIC_KEY);
    return Response.json(
      { encrypted: reEncryptedData },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error("Proxy failed:", err);
    return Response.json({ error: "Proxy failed" }, { status: 500 });
  }
}
