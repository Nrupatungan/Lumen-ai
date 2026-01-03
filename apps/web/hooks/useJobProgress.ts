// React hook for subscribing to ingestion job progress via WebSocket

import { useEffect, useRef, useState } from "react";

export interface JobProgressEvent {
  jobId: string;
  stage?: string;
  progress?: number;
  error?: string;
}

interface UseJobProgressOptions {
  jobId?: string;
  enabled?: boolean;
}

export function useJobProgress({
  jobId,
  enabled = true,
}: UseJobProgressOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const [data, setData] = useState<JobProgressEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jobId || !enabled) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/progress`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);

      socket.send(
        JSON.stringify({
          action: "subscribe",
          jobId,
        }),
      );
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setData(payload);
      } catch {
        // intentionally ignored
      }
    };

    socket.onerror = () => {
      setConnected(false);
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [jobId, enabled]);

  return {
    connected,
    progress: data?.progress,
    stage: data?.stage,
    error: data?.error,
    raw: data,
  };
}
