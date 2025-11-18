# Encrypted API Proxy

A monorepo setup that securely encrypts frontend API requests and routes them through a Next.js proxy, preventing exposure of backend URLs and sensitive data in browser DevTools.

## ✅ Security Features

- Double encryption (public key + secret key)
- HMAC signature on all requests and responses
- Backend URLs hidden from client
- Payloads encrypted (obfuscated in DevTools)
- Relative URLs only (no external requests)
- Response signature verification

## 🔒 Security Model Overview

- Public Key:

  - Used only for obfuscation. It never grants backend access.

- Secret Key & Signature Key:

  - Used together for secure communication between frontend and backend.
  - The backend verifies both payload and signature to avoid tampering.

- Internal Key:

  - Protects sensitive internal endpoints that should only be callable from within the backend itself.

- This separation ensures:

  - Public UI can obfuscate or encode data without exposing sensitive keys.
  - Communication between frontend and backend is authenticated and validated.
  - Internal backend routes cannot be triggered externally.

## 🔒 How It Works

```
Frontend
  ↓ [encrypt with public key]
Next.js API (http://localhost:3000/api/proxy)
  ↓ [decrypt + re-encrypt with secret key]
Backend API (http://localhost:3001/api/proxy)
  ↓ [decrypt + route internal request]
Internal API (e.g., /internal/api/people)
  ↓ [encrypt response + sign]
Backend API
  ↓ [decrypt + re-encrypt + sign]
Next.js API
  ↓ [decrypt + re-encrypt with public key]
Frontend
```

## Screenshots

- **Only `/api/proxy` is visible:**  
  The frontend never directly accesses backend endpoints. All requests are routed through the proxy.

![Network Tab Headers Screenshot](images/url.png)

- **Encrypted payload and response:**  
  Request body and Response shows `{ "encrypted": "..." }`, so sensitive data is obfuscated in the network tab.

![Network Tab Payload Screenshot](images/payload.png)
![Network Tab Response Screenshot](images/response.png)

- **Data and Usage**

![Code](images/code.png)

- **this is what the `console.log(data)` looks like**.

![Data on Console Log](images/clg.png)

## 📁 Structure

```
backend-proxy/
├── shared/          # Encryption utilities & types
├── frontend/        # Next.js app (port 3000)
└── backend/         # Hono API server (port 3001)
```

## 🚀 Setup

```bash
# Install dependencies
pnpm install

# Setup environment variables (see .env.example in each folder)

# Build
pnpm run build:all

# Run all services
pnpm run start:all
```

Services will start at:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📦 Packages

### shared

Encryption & type utilities used by frontend and backend.

**Key exports:**

- `encrypt(data, key)` - Encrypt data
- `decrypt(encrypted, key)` - Decrypt data
- `signPayload(data, key)` - Create HMAC signature
- `verifySignature(data, signature, key)` - Verify signature

### frontend

Next.js frontend with encryption client.

**Key files:**

- `app/api/proxy/route.ts` - Proxy endpoint that re-encrypts requests
- `utils/api-proxy.ts` - Client utilities for encrypted requests

### backend

Hono backend with proxy endpoint.

**Key files:**

- `src/index.ts` - Proxy endpoint that routes decrypted requests
- `src/utils.ts` - Response encryption helpers
- `data/people.ts` - Sample data

## 🔐 Environment Variables

**Frontend (.env)**

```env
<!-- PUBLIC -->
NEXT_PUBLIC_PUBLIC_KEY=<base64_public_key>

<!-- SECRET -->
SECRET_KEY=<base64_secret_key>
SIGNATURE_KEY=<base64_hmac_key>
BACKEND_PROXY=http://localhost:3001/api/proxy
```

| Variable                   | Description                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| **NEXT_PUBLIC_PUBLIC_KEY** | Public key used for client-side obfuscation. Safe to expose.        |
| **SECRET_KEY**             | Shared secret key for encrypted communication with the backend.     |
| **SIGNATURE_KEY**          | Key used to generate request signatures (HMAC) to verify integrity. |
| **BACKEND_PROXY**          | Next.js API route that proxies requests to the backend.             |

**Backend (.env)**

```env
SECRET_KEY=<base64_secret_key>
SIGNATURE_KEY=<base64_hmac_key>
INTERNAL_KEY=<base64_hmac_key>
FRONTEND_PROXY=http://localhost:3000/api/proxy
```

| Variable           | Description                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **SECRET_KEY**     | Must match the frontend's `SECRET_KEY`; used for decrypting or validating encrypted content. |
| **SIGNATURE_KEY**  | Must match the frontend's `SIGNATURE_KEY`; used for verifying request signatures.            |
| **INTERNAL_KEY**   | Key used for internal backend-to-backend route calls to ensure they’re trusted.              |
| **FRONTEND_PROXY** | Optional proxy routing back to the frontend if needed (e.g., verification or shared tasks).  |

See `.env.example` in each folder for details.

## 📡 Request Format

**Frontend → Next.js Proxy:**

```json
{
  "encrypted": "base64_encrypted_string"
}
```

**Next.js Proxy → Backend (with signature verification):**

```json
{
  "encrypted": "base64_encrypted_string"
}
```

Header: `X-Signature: hmac_signature`

**Decrypted request payload format:**

```json
{
  "url": "/api/people",
  "method": "GET",
  "body": null
}
```
