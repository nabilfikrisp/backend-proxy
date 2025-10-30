import { encrypt } from "@backend-proxy/shared";

export default function Home() {
  const encrypted = encrypt("Hello, World!");

  return <h1 className="text-3xl font-bold">{encrypted}</h1>;
}
