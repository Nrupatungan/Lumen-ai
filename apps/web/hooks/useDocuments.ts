"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { queryClient } from "@/components/Providers";

export type DocumentItem = {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  ingestion?: {
    jobId: string;
    status: string;
    error?: string;
  } | null;
};

export function useDocuments() {
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.get("/documents");
      return res.data.documents as DocumentItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    upload: uploadMutation,
    deleteDocument: deleteMutation,
  };
}
