import { DocumentSourceType } from "@repo/policy-node";

export function resolveSourceType(filename: string): DocumentSourceType | null {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return "pdf";
    case "md":
    case "markdown":
      return "md";
    case "txt":
      return "txt";
    case "docx":
      return "docx";
    case "pptx":
      return "pptx";
    case "epub":
      return "epub";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return "image";
    default:
      return null;
  }
}
