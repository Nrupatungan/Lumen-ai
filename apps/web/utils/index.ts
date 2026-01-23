import { RagSource } from "@/components/chat/types";

export function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function loadScript(src: string) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Appends inline citations like [1][2] to the content
 */
export function withInlineCitations(
  content: string,
  sources?: RagSource[],
): string {
  if (!sources || sources.length === 0) return content;

  const refs = sources.map((_, i) => `[${i + 1}]`).join("");
  return `${content}\n\n${refs}`;
}
