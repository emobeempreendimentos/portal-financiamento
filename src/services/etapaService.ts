import { Etapa, ApiResponse } from "@/types";

export const etapaService = {
  async atualizar(id: string, data: Partial<Etapa>): Promise<ApiResponse<Etapa>> {
    const res = await fetch(`/api/etapas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
