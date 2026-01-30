# Lambdas

Lambdas handle short-lived, event-driven tasks.
They orchestrate pipelines but do not perform heavy processing.

---

## 🧱 Responsibilities

- Ingestion routing
- Cron-based jobs (usage sync, cleanup)
- Lightweight validation
- Policy-aware pipeline decisions

---

## 🧠 Architecture Overview

- **Runtime:** AWS Lambda
- **Trigger:** SQS / EventBridge
- **State:** MongoDB + Redis
- **Policy:** Centralized in `@repo/policy`

---

## 📂 Lambdas

apps/lambdas/
├── ingestion-router/ # Routes documents to workers
├── usage-sync/ # Daily usage persistence
└── cleanup/ # TTL / maintenance jobs

---

## 🔁 Ingestion Routing Logic

```text
Upload → Ingestion Router
        ├── image → OCR (if allowed)
        └── text  → Text Extract
                → Chunk + Embed
```

## 🔐 Policy Enforcement

- OCR gated by plan
- Unsupported sources rejected early
- Plan is resolved inside the Lambda

## 🧪 Local Testing

```bash
pnpm dev
```

---

## Use:

- LocalStack or real AWS
- SQS test messages
- MongoDB running

## 🛑 Important Rules

- Lambdas must be idempotent
- No long-running CPU work
- Always update Mongo on failure
- Redis is best-effort only

## ✅ What you now have

- Clear separation of concerns
- Onboarding-ready documentation
- Ops-friendly architecture explanation
- Future-proof mental model for contributors

If you want next, I can:

- generate **architecture diagrams**
- write a **root monorepo README**
- create **runbooks** for failures
- or add **ADR docs** for key decisions

Just say the word 🚀
