import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export function useChunkPreview(chunkId?: string) {
  return useQuery({
    queryKey: ["chunk-preview", chunkId],
    queryFn: async () => {
      const res = await api.get(`/documents/chunks/${chunkId}`);
      return res.data as {
        content: string;
        chunkIndex: number;
        documentId: string;
      };
    },
    enabled: Boolean(chunkId),
  });
}
