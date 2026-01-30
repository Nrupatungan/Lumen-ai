This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# LumenAI – Web App

This is the **Next.js (App Router)** frontend for **LumenAI**, a Retrieval-Augmented Generation (RAG) application.  
It handles authentication, document management, chat UI, billing, and user profile management.

The app is built with:

- **Next.js App Router**
- **TypeScript**
- **MUI (Material UI)**
- **TanStack React Query**
- **JWT-based API auth**
- **Streaming chat (SSE)**

---

## 📁 Project Structure

### `app/` – Routes (Next.js App Router)

#### `(public)`

Unauthenticated pages:

- `/` – Landing page
- `/pricing`
- `/sign-in`, `/sign-up`
- `/forgot-password`, `/reset-password`
- `/verify-email`

#### `(protected)`

Authenticated pages (JWT required):

- `/chat` – Main chat + RAG interface
- `/documents` – Uploaded document management
- `/billing` – Subscription & usage
- `/profile` – User profile
- `/dashboard` – Overview / entry point

Each route uses its own `layout.tsx` where needed.

---

### `components/`

Reusable UI components grouped by domain.

#### `components/chat/`

Core chat UI:

- `Chat.tsx` – Chat state + orchestration
- `ChatSidebar.tsx` – Conversation list
- `ChatHeader.tsx` – Header + controls
- `ChatInput.tsx` – Message input
- `ChatMessageList.tsx` – Scroll + rendering
- `ChatMessageItem.tsx` – Individual message
- `ChatMessageSources.tsx` – RAG citations
- `SourcePreviewModal.tsx` – Chunk preview modal
- `AccountMenu.tsx` – User menu

#### `components/documents/`

- Document ingestion status
- Upload & delete UI

#### `components/auth/`

- Sign in / sign up / reset flows

#### `components/billing/`

- Billing & subscription UI

---

### `hooks/`

All data-fetching logic lives here (React Query).

Key hooks:

- `useMe` – Current user profile
- `useDocuments` – Uploaded documents
- `useChatConversations` – Conversation list
- `useConversationMessages` – Messages in a conversation
- `useChunkPreview` – RAG chunk preview
- `useToast` – Global notifications

> **Rule:** Components never call APIs directly—only hooks do.

---

### `lib/`

Shared utilities and API clients:

- `apiClient.ts` – Typed API wrapper
- `chatStream.ts` – SSE streaming helper
- `data.ts` – Static UI data (suggested prompts, etc.)
- `types.ts` – Shared frontend types
- `validation/` – Form validation schemas

---

### `utils/`

Small, framework-agnostic helpers:

- Inline citations
- Formatting helpers
- Shared logic used across components

---

## 💬 Chat & RAG Architecture

### Conversations

- Conversations are created automatically on first message
- Each conversation belongs to a user
- Sidebar shows **most recent conversations**, sorted by activity

### Messages

- Optimistic UI for user messages
- Assistant responses:
  - Non-streaming (`POST /chat/conversations`)
  - Streaming via SSE (`POST /chat/stream`)
- Messages may include **RAG sources**

### RAG Sources

- Assistant messages include `sources[]`
- Each source maps to a document chunk
- Clicking a source opens `SourcePreviewModal`
- Chunk content is fetched lazily

---

## 🔐 Authentication

- JWT-based authentication
- Auth state resolved via `useMe`
- Protected routes are enforced server-side
- Session-safe behavior for transient server errors

---

## 🎨 Styling & UI

- Material UI (MUI)
- Centralized theme via `Providers`
- Dark / light mode supported
- Responsive layouts throughout

---

## 🧪 Data Fetching & Caching

- **TanStack React Query**
- Intelligent cache invalidation
- Optimistic updates for chat
- Background refetching where appropriate

---

## 🚀 Development

### Install

```bash
pnpm install
```

### Environment

Ensure the API backend is running and available via the configured proxy.

## 🧠 Design Principles

- Separation of concerns
- Hooks over inline data fetching
- Optimistic UX
- Type safety end-to-end
- Streaming-first chat experience

## 📌 Notes

- Chat UI is designed to scale to advanced RAG features
- Citations and chunk previews are first-class citizens
- The architecture supports future features like:
- Multi-document answers
- Source confidence scoring
- Conversation renaming
- Thread summaries

### LumenAI Web – fast, typed, and built for serious RAG workflows ✨
