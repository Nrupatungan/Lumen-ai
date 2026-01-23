import { fetchEventSource } from "@microsoft/fetch-event-source";

type StreamChatArgs = {
  message: string;
  documentIds: string[];
  conversationId?: string;

  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error?: string) => void;

  signal: AbortSignal;
};

export async function streamChat({
  message,
  documentIds,
  conversationId,
  onToken,
  onComplete,
  onError,
  signal,
}: StreamChatArgs) {
  let completed = false;

  try {
    await fetchEventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          documentIds,
          conversationId,
        }),
        signal,

        onmessage(ev) {
          // Server signals completion explicitly
          if (ev.event === "end") {
            completed = true;
            onComplete();
            return;
          }

          // Server-side error event
          if (ev.event === "error") {
            completed = true;
            try {
              const data = JSON.parse(ev.data);
              onError(data?.error ?? "Streaming failed");
            } catch {
              onError("Streaming failed");
            }
            return;
          }

          // Normal token event
          try {
            const data = JSON.parse(ev.data);
            if (typeof data.token === "string") {
              onToken(data.token);
            }
          } catch {
            // Ignore malformed chunks
          }
        },

        onerror() {
          // Abort is user-initiated, not an error
          if (signal.aborted) {
            return;
          }

          // Prevent duplicate callbacks
          if (!completed) {
            completed = true;
            onError("Connection lost");
          }
        },
      },
    );
  } catch {
    // fetchEventSource throws on network failure
    if (!signal.aborted && !completed) {
      onError("Unable to connect to server");
    }
  }
}
