export function extractTextContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | any[],
): string {
  if (typeof content === "string") return content;

  // LangChain structured content (safest normalization)
  return content
    .map((block) => {
      if (typeof block === "string") return block;
      if ("text" in block) return block.text;
      return "";
    })
    .join("");
}
