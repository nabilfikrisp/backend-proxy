import { decrypt, encrypt, EncryptedProxyRequest } from "@backend-proxy/shared";

const BACKEND_PROXY = process.env.BACKEND_PROXY!;
const SECRET_KEY = process.env.SECRET_KEY!;
const INTERNAL_KEY = process.env.INTERNAL_KEY!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY!;

export async function POST(request: Request) {
  try {
    const encryptedReq: EncryptedProxyRequest = await request.json();
    const decryptedReq = decrypt(encryptedReq.encrypted, PUBLIC_KEY);
    const reEncryptedReq = encrypt(decryptedReq, SECRET_KEY);

    const backendRes = await fetch(BACKEND_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_KEY,
      },
      body: JSON.stringify({ encrypted: reEncryptedReq }),
    });

    const data = await backendRes.json();

    const decryptedData = decrypt(data.encrypted, SECRET_KEY);
    const reEncryptedData = encrypt(decryptedData, PUBLIC_KEY);

    return Response.json(
      { encrypted: reEncryptedData },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error("Frontend proxy error:", err);
    const errorData = { error: "Proxy failed" };
    const encryptedError = encrypt(JSON.stringify(errorData), PUBLIC_KEY);
    return Response.json({ encrypted: encryptedError }, { status: 500 });
  }
}
