// Fase 0: cliente Axios central para futuras APIs internas y publicaciones externas.
import axios from "axios";

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});
