# Workers (ECS)

Workers are long-running background services responsible for CPU / IO heavy tasks.
They are triggered via SQS and run independently from the API.

---

## 🧱 Responsibilities

- Text extraction (PDF, DOCX, PPTX, EPUB, MD, TXT)
- OCR extraction (images via Textract)
- Chunking & embedding documents
- Vector ingestion into Pinecone
- Job progress tracking via Redis
- Authoritative status updates in MongoDB

---

## 🧠 Architecture Overview

- **Runtime:** Node.js
- **Execution:** ECS (long-running workers)
- **Queue:** SQS
- **Parsing:** LangChain document loaders
- **OCR:** AWS Textract
- **Embeddings:** OpenAI
- **Vector DB:** Pinecone

---

## 📂 Workers

apps/workers/
├── text-extract/ # LangChain loaders → text
├── ocr-extract/ # Textract OCR pipeline
├── chunk-embed/ # Split → embed → store
└── shared/ # Common utilities

---

## 🔁 Processing Flow

1. Receive SQS message
2. Update job status in Redis + Mongo
3. Process payload
4. Forward to next queue (if needed)
5. Mark job complete or failed

---

## 📄 Supported Source Types

Handled via LangChain loaders:

| Type  | Loader         |
| ----- | -------------- |
| PDF   | PDFLoader      |
| DOCX  | DocxLoader     |
| PPTX  | PPTXLoader     |
| EPUB  | EPubLoader     |
| MD    | MarkdownLoader |
| TXT   | TextLoader     |
| Image | Textract (OCR) |

---

## 🔐 Policy Enforcement

Workers enforce:

- OCR availability (Pro-only)
- Embedding model per plan
- Pinecone index per plan

Workers **never trust SQS blindly** — plan is re-resolved per job.

---

## 🚨 Error Handling

- Redis updates are best-effort
- Mongo is authoritative
- Failed jobs:
  - `status = failed`
  - error recorded
  - progress published

---

## 🧪 Local Testing

```bash
pnpm dev
```
