"use client";

// React hook for subscribing to ingestion job progress via WebSocket
import { apiClient } from "@/lib/apiClient";
import { getWebSocketUrl } from "@/utils";
import { useEffect, useRef, useState } from "react";

export interface JobProgressEvent {
  jobId: string;
  stage?: string;
  progress?: number;
  error?: string;
  done?: boolean;
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
  const subscribedJobRef = useRef<string | null>(null);

  const [data, setData] = useState<JobProgressEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jobId || !enabled) {
      console.log("WS skipped: missing jobId or disabled");
      socketRef.current?.close();
      socketRef.current = null;
      subscribedJobRef.current = null;
      setData(null);
      return;
    }

    if (subscribedJobRef.current === jobId) return;

    subscribedJobRef.current = jobId;

    let cancelled = false;

    async function connect() {
      console.log("Fetching WS token...");
      const token = await apiClient.getWsToken();

      if (!token || cancelled) return;

      const wsUrl = getWebSocketUrl(
        `/ws/progress?token=${encodeURIComponent(token)}`,
      );

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;

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
          const payload: JobProgressEvent = JSON.parse(event.data);
          setData(payload);

          if (payload.done || payload.progress === 100) {
            socket.close();
          }
        } catch {
          // ignore malformed messages
        }
      };

      socket.onclose = () => {
        socketRef.current = null;
        subscribedJobRef.current = null;
        setConnected(false);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
      subscribedJobRef.current = null;
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
