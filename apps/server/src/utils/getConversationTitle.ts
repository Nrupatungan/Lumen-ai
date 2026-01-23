export function generateConversationTitle(message: string): string {
  return message
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60) // hard cap
    .replace(/[?.!,:;]+$/, ""); // clean ending punctuation
}
