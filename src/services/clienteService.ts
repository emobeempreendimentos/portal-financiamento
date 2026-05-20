import { User, ApiResponse } from "@/types";

export const clienteService = {
  async listar(): Promise<ApiResponse<User[]>> {
    const res = await fetch("/api/clientes");
    return res.json();
  },

  async buscar(id: string): Promise<ApiResponse<User>> {
    const res = await fetch(`/api/clientes/${id}`);
    return res.json();
  },

  async criar(data: Partial<User> & { senha: string }): Promise<ApiResponse<User>> {
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async atualizar(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const res = await fetch(`/api/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async excluir(id: string): Promise<ApiResponse> {
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    return res.json();
  },
};
