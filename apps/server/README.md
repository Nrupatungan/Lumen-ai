# Server (API)

This service is the primary HTTP API for the Lumen platform.  
It handles authentication, user management, documents, chat (RAG), billing, and dashboards.

---

## 🧱 Responsibilities

- User authentication (Credentials + OAuth via Auth.js)
- User profile & subscription APIs
- Document upload & ingestion initiation
- Chat / RAG APIs (non-streaming + streaming)
- Payments & billing APIs
- Usage dashboards
- Cache-aware read APIs (Redis + MongoDB)

---

## 🧠 Architecture Overview

- **Framework:** Express.js
- **Auth:** JWT (decoded into `req.user`)
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (read-through + TTL per plan)
- **Queueing:** SQS (document ingestion pipeline)
- **Storage:** S3 (documents, avatars)
- **Vector DB:** Pinecone (via LangChain)
- **LLMs:** OpenAI (model per plan)

---

## 📂 Key Folders

```bash
apps/server/
├── controllers/ # Route handlers
├── routes/ # Express routers
├── middlewares/ # Auth, error handling
├── services/ # Email, auth helpers
├── utils/ # Shared helpers
├── config/ # Constants & env config
└── app.ts # App bootstrap
```

---

## 🔐 Authentication Model

- Frontend uses **Auth.js**
- Backend trusts JWT and populates `req.user`
- Backend still manages:
  - Credential login
  - Email verification
  - Password reset
  - OAuth account linking

---

## 📦 Caching Strategy

- Redis cache helpers live in `@repo/cache`
- Cache TTLs are **plan-aware**
- Controllers follow this pattern:
  1. Try cache
  2. Fallback to Mongo
  3. Cache result
  4. Invalidate on writes

Cached endpoints include:

- `/users/me`
- `/users/me/subscription`
- `/users/me/usage`
- `/documents`
- `/documents/:id/status`
- `/conversations`
- `/payments`

---

## 🚀 Running Locally

```bash
pnpm install
pnpm dev

Required env vars:

MONGO_URI

REDIS_HOST

REDIS_PORT

S3_BUCKET_NAME

OPENAI_API_KEY

PINECONE_API_KEY

RAZORPAY_KEY_ID

RAZORPAY_KEY_SECRET
```

## 🧩 Notes

- All writes are authoritative in MongoDB
- Redis is best-effort
- Never trust client-provided user IDs
- Plan policy is enforced server-side only
