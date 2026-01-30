import {
  CloudUpload,
  Psychology,
  QuestionAnswer,
  ManageSearch,
  Bolt,
  VerifiedUser,
} from "@mui/icons-material";
import { DocumentSourceType } from "./types";

export const stats = [
  { value: "10M+", label: "Documents Processed" },
  { value: "500ms", label: "Avg Response Time" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "50K+", label: "Happy Users" },
];

export const features = [
  {
    Icon: CloudUpload,
    title: "Document Ingestion",
    description:
      "Upload PDFs, Word docs, and text files. Our AI automatically chunks and indexes your content for lightning-fast retrieval.",
  },
  {
    Icon: Psychology,
    title: "Intelligent RAG Pipeline",
    description:
      "Powered by OpenAI embeddings and advanced vector search. Get accurate answers grounded in your actual documents.",
  },
  {
    Icon: QuestionAnswer,
    title: "Real-time AI Chat",
    description:
      "Stream responses in real-time. Ask questions about your documents and get instant, contextual answers.",
  },
  {
    Icon: ManageSearch,
    title: "Vector Search",
    description:
      "Semantic search that understands meaning, not just keywords. Find relevant content across thousands of documents.",
  },
  {
    Icon: Bolt,
    title: "Blazing Fast",
    description:
      "Built for speed with Redis caching, optimized workers, and intelligent query planning. Responses in milliseconds.",
  },
  {
    Icon: VerifiedUser,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant infrastructure. Your data is encrypted at rest and in transit. Role-based access control included.",
  },
];

export const testimonials = [
  {
    quote:
      "LumenAI transformed how our legal team works. We can now search through decades of case files in seconds.",
    author: "Sarah Chen",
    role: "General Counsel, TechCorp",
    avatar: "SC",
  },
  {
    quote:
      "The RAG pipeline is incredibly accurate. It's like having an expert who's read every document we've ever created.",
    author: "Michael Rodriguez",
    role: "VP Engineering, DataFlow",
    avatar: "MR",
  },
  {
    quote:
      "We reduced our research time by 80%. The real-time chat feature feels like magic.",
    author: "Emily Johnson",
    role: "Research Director, BioMed Inc",
    avatar: "EJ",
  },
];

export const protectedLinks = [
  { label: "Chat", href: "/chat" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Documents", href: "/documents" },
];

export const publicLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
];

export const faqs = [
  {
    question: "How does the free plan work?",
    answer:
      "The free plan includes 5 documents and 100 queries per month. It's perfect for trying out NeuralDocs and small personal projects. You can upgrade anytime.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, and UPI payments through Razorpay. Enterprise customers can also pay via invoice.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing.",
  },
  {
    question: "What happens to my data if I downgrade?",
    answer:
      "Your data is never deleted. If you exceed your new plan's limits, you won't be able to add new documents until you're within limits, but existing documents remain searchable.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: "Is there a self-hosted option?",
    answer:
      "Enterprise customers can request a self-hosted deployment. Contact our sales team to discuss your requirements.",
  },
];

export const pricingTiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    features: [
      "5 documents",
      "100 queries/month",
      "Basic RAG search",
      "Community support",
    ],
    limits: {
      documents: 5,
      queries: 100,
      storage: 50 * 1024 * 1024, // 50MB
    },
    popular: false,
  },
  {
    id: "go",
    name: "Go",
    price: 29,
    currency: "USD",
    features: [
      "50 documents",
      "1000 queries/month",
      "Advanced RAG with GPT-4.1 mini",
      "Large embedding model",
      "Priority support",
    ],
    limits: {
      documents: -1,
      queries: 1000,
      storage: 1024 * 1024 * 1024, // 1GB
    },
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    currency: "USD",
    features: [
      "Unlimited everything",
      "Dedicated infrastructure",
      "Custom embeddings",
      "SSO & SAML",
      "24/7 support",
      "SLA guarantee",
    ],
    limits: {
      documents: -1,
      queries: -1,
      storage: -1,
    },
    popular: false,
  },
] as const;

export const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "API Docs", href: "/docs" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export const suggestedPrompts = [
  "What are the main topics covered in my documents?",
  "Summarize the key points from the most recent upload",
  "Find information about a specific topic",
  "Compare concepts across my documents",
];

export const PLAN_POLICY = {
  Free: {
    pricing: {
      price: 0,
      duration: Infinity,
    },
    documents: {
      allowedSourceTypes: ["pdf", "md", "txt"] as DocumentSourceType[],
      maxDocuments: 5,
    },
    chat: {
      dailyTokens: 25_000,
      dailyRequests: 10,
      streaming: false,
      model: "gpt-4.1-mini",
      queries: 100,
    },
    embeddings: {
      model: "text-embedding-3-small",
      index: "free-tier",
      expectedDimensions: 1536,
    },
    ingestion: {
      ocr: false,
    },
  },

  Go: {
    pricing: {
      price: 29,
      duration: 30,
    },
    documents: {
      allowedSourceTypes: [
        "pdf",
        "md",
        "txt",
        "docx",
        "epub",
        "pptx",
      ] as DocumentSourceType[],
      maxDocuments: 50,
    },
    chat: {
      dailyTokens: 250_000,
      dailyRequests: 500,
      streaming: true,
      model: "gpt-4.1-mini",
      queries: 1000,
    },
    embeddings: {
      model: "text-embedding-3-large",
      index: "paid-tier",
      expectedDimensions: 3072,
    },
    ingestion: {
      ocr: false,
    },
  },

  Pro: {
    pricing: {
      price: 99,
      duration: 30,
    },
    documents: {
      allowedSourceTypes: [
        "pdf",
        "md",
        "txt",
        "docx",
        "epub",
        "pptx",
        "image",
      ] as DocumentSourceType[],
      maxDocuments: Infinity,
    },
    chat: {
      dailyTokens: 1_000_000,
      dailyRequests: Infinity,
      streaming: true,
      model: "gpt-4.1",
      queries: Infinity,
    },
    embeddings: {
      model: "text-embedding-3-large",
      index: "paid-tier",
      expectedDimensions: 3072,
    },
    ingestion: {
      ocr: true,
    },
  },
} as const;
