import { OrderType, PaymentVerificaitonType } from "@repo/shared";
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL!,
  withCredentials: true,
});

class ApiClient {
  async register(formData: FormData) {
    const res = await api.post("/users/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return { status: res.status, data: res.data };
  }

  async createOrder(data: OrderType) {
    const res = await api.post("/payments/order", data);
    return res.data;
  }

  async verifyPayment(data: PaymentVerificaitonType) {
    const res = await api.post("/payments/verify", data);
    return { status: res.status, data: res.data };
  }

  async sendChatMessage(payload: {
    message: string;
    conversationId?: string;
    documentIds?: string[];
  }) {
    const res = await api.post("/chat/conversations", payload);
    return res.data;
  }

  async getWsToken() {
    const res = await api.get("/ws/issue-token");
    return res.data.token;
  }

  async getConversations<T>() {
    const res = await api.get("/chat/conversations");
    return res.data as T;
  }

  async getConversationMessages<T>(conversationId: string) {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data as T;
  }
}

export const apiClient = new ApiClient();
