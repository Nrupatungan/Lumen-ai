import { OrderType, PaymentVerificaitonType } from "@repo/shared";
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL!,
  withCredentials: true,
});

class ApiClient {
  async getUserDetails() {
    const res = await api.get("/users/me");
    return res.data;
  }

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
}

export const apiClient = new ApiClient();
